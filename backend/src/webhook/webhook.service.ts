import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { randomUUID } from 'crypto';
import { createHmac } from 'crypto';
import { firstValueFrom, timeout, catchError, Observable } from 'rxjs';
import {
	WebhookSubscription,
	WebhookClientType,
	WebhookEventType,
	WebhookPayload,
	WebhookHeaders,
	DeliveryResult,
	GameJoinedPayload,
	GameStateChangedPayload,
	QuestionStartPayload,
	QuestionEndPayload,
	PlayerFeedbackPayload,
	LeaderboardPayload,
	PlayerLeftPayload,
	GameEndedPayload,
	WhiteboardQuestionEndPayload,
	WhiteboardLeaderboardPayload,
} from './webhook.types';

/**
 * Configuration for delivery behavior
 */
interface DeliveryConfig {
	timeoutMs: number;
	maxRetries: number;
	retryDelayMs: number;
	backoffMultiplier: number;
	maxConsecutiveFailures: number;
}

/**
 * WebhookService - Low-latency event delivery
 *
 * Responsibilities:
 * - In-memory subscription management
 * - HMAC signature generation
 * - Parallel webhook delivery
 * - Retry with exponential backoff
 * - Subscription health tracking
 */
@Injectable()
export class WebhookService {
	private readonly logger = new Logger(WebhookService.name);

	// Primary index: subscriptionId -> subscription
	private readonly subscriptions = new Map<string, WebhookSubscription>();

	// Secondary index: pin -> Set<subscriptionId> for fast event routing
	private readonly pinIndex = new Map<string, Set<string>>();

	// Player-specific index: `${pin}:${playerId}` -> subscriptionId
	private readonly playerIndex = new Map<string, string>();

	private readonly config: DeliveryConfig = {
		timeoutMs: 1500,
		maxRetries: 2,
		retryDelayMs: 100,
		backoffMultiplier: 2,
		maxConsecutiveFailures: 5,
	};

	constructor(private readonly httpService: HttpService) {}

	// ============================================
	// Subscription Management
	// ============================================

	/**
	 * Register a host or whiteboard webhook subscription
	 */
	registerSubscription(
		pin: string,
		clientType: Extract<WebhookClientType, 'host' | 'whiteboard'>,
		targetUrl: string,
		secret: string,
	): WebhookSubscription {
		const id = randomUUID();
		const now = new Date();

		const subscription: WebhookSubscription = {
			id,
			pin,
			clientType,
			targetUrl,
			secret,
			createdAt: now,
			status: 'active',
			consecutiveFailures: 0,
		};

		this.subscriptions.set(id, subscription);
		this.addToPinIndex(pin, id);

		this.logger.log(`Registered ${clientType} webhook for game ${pin}: ${id}`);
		return subscription;
	}

	/**
	 * Register a player-specific webhook subscription
	 */
	registerPlayerSubscription(
		pin: string,
		playerId: string,
		targetUrl: string,
		secret: string,
	): WebhookSubscription {
		const playerKey = `${pin}:${playerId}`;

		// Remove existing subscription for this player if any
		const existingId = this.playerIndex.get(playerKey);
		if (existingId) {
			this.removeSubscription(existingId);
		}

		const id = randomUUID();
		const now = new Date();

		const subscription: WebhookSubscription = {
			id,
			pin,
			clientType: 'player',
			playerId,
			targetUrl,
			secret,
			createdAt: now,
			status: 'active',
			consecutiveFailures: 0,
		};

		this.subscriptions.set(id, subscription);
		this.addToPinIndex(pin, id);
		this.playerIndex.set(playerKey, id);

		this.logger.log(`Registered player webhook for ${playerId} in game ${pin}: ${id}`);
		return subscription;
	}

	/**
	 * Get subscription by ID
	 */
	getSubscription(id: string): WebhookSubscription {
		const subscription = this.subscriptions.get(id);
		if (!subscription) {
			throw new NotFoundException(`Webhook subscription ${id} not found`);
		}
		return subscription;
	}

	/**
	 * Remove a subscription
	 */
	removeSubscription(id: string): void {
		const subscription = this.subscriptions.get(id);
		if (!subscription) {
			throw new NotFoundException(`Webhook subscription ${id} not found`);
		}

		this.subscriptions.delete(id);
		this.removeFromPinIndex(subscription.pin, id);

		if (subscription.playerId) {
			this.playerIndex.delete(`${subscription.pin}:${subscription.playerId}`);
		}

		this.logger.log(`Removed webhook subscription ${id}`);
	}

	/**
	 * Remove all subscriptions for a game
	 */
	removeGameSubscriptions(pin: string): void {
		const subIds = this.pinIndex.get(pin);
		if (!subIds) return;

		for (const id of subIds) {
			const sub = this.subscriptions.get(id);
			if (sub?.playerId) {
				this.playerIndex.delete(`${pin}:${sub.playerId}`);
			}
			this.subscriptions.delete(id);
		}

		this.pinIndex.delete(pin);
		this.logger.log(`Removed all webhook subscriptions for game ${pin}`);
	}

	/**
	 * Update subscription status
	 */
	private updateSubscriptionStatus(
		id: string,
		success: boolean,
	): void {
		const subscription = this.subscriptions.get(id);
		if (!subscription) return;

		subscription.lastSeenAt = new Date();

		if (success) {
			subscription.consecutiveFailures = 0;
			subscription.status = 'active';
		} else {
			subscription.consecutiveFailures++;
			if (subscription.consecutiveFailures >= this.config.maxConsecutiveFailures) {
				subscription.status = 'failed';
				this.logger.warn(
					`Subscription ${id} marked as failed after ${subscription.consecutiveFailures} consecutive failures`,
				);
			}
		}
	}

	// ============================================
	// Index Management
	// ============================================

	private addToPinIndex(pin: string, id: string): void {
		let set = this.pinIndex.get(pin);
		if (!set) {
			set = new Set();
			this.pinIndex.set(pin, set);
		}
		set.add(id);
	}

	private removeFromPinIndex(pin: string, id: string): void {
		const set = this.pinIndex.get(pin);
		if (set) {
			set.delete(id);
			if (set.size === 0) {
				this.pinIndex.delete(pin);
			}
		}
	}

	// ============================================
	// Signature Generation
	// ============================================

	/**
	 * Generate HMAC SHA256 signature for payload verification
	 */
	private generateSignature(payload: string, secret: string): string {
		return createHmac('sha256', secret).update(payload).digest('hex');
	}

	/**
	 * Build webhook headers with security signatures
	 */
	private buildHeaders(
		payload: string,
		secret: string,
	): WebhookHeaders {
		const timestamp = new Date().toISOString();
		const webhookId = randomUUID();
		const signature = this.generateSignature(payload, secret);

		return {
			'X-Webhook-Id': webhookId,
			'X-Webhook-Timestamp': timestamp,
			'X-Webhook-Signature': signature,
			'Content-Type': 'application/json',
		};
	}

	// ============================================
	// Delivery Engine
	// ============================================

	/**
	 * Deliver payload to a single subscription with retry
	 */
	private async deliverToSubscription(
		subscription: WebhookSubscription,
		payload: string,
	): Promise<DeliveryResult> {
		const startTime = process.hrtime.bigint();
		let lastError: string | undefined;
		let statusCode: number | undefined;

		for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
			if (attempt > 0) {
				// Exponential backoff
				const delay = this.config.retryDelayMs * Math.pow(this.config.backoffMultiplier, attempt - 1);
				await this.sleep(delay);
			}

			try {
				const headers = this.buildHeaders(payload, subscription.secret);
				
				const response = await firstValueFrom(
					this.httpService.post<unknown>(subscription.targetUrl, payload, {
						headers,
						validateStatus: () => true, // Don't throw on any status
					}).pipe(
						timeout(this.config.timeoutMs),
						catchError((err: Error) => {
							throw err;
						}),
					) as Observable<AxiosResponse<unknown>>,
				);

				statusCode = response.status;

				if (response.status >= 200 && response.status < 300) {
					const durationMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;
					this.updateSubscriptionStatus(subscription.id, true);
					
					return {
						subscriptionId: subscription.id,
						success: true,
						statusCode,
						durationMs,
					};
				}

				lastError = `HTTP ${response.status}`;
			} catch (err) {
				lastError = err instanceof Error ? err.message : 'Unknown error';
			}
		}

		const durationMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;
		this.updateSubscriptionStatus(subscription.id, false);

		this.logger.warn(
			`Webhook delivery failed for ${subscription.id} after ${this.config.maxRetries + 1} attempts: ${lastError}`,
		);

		return {
			subscriptionId: subscription.id,
			success: false,
			statusCode,
			error: lastError,
			durationMs,
		};
	}

	/**
	 * Non-blocking sleep utility
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Emit event to all relevant subscriptions for a game
	 * Uses parallel delivery for minimum latency
	 */
	async emit<T>(
		pin: string,
		event: WebhookEventType,
		data: T,
		options?: {
			targetClientTypes?: WebhookClientType[];
			targetPlayerId?: string;
			whiteboardEnhancedData?: unknown;
		},
	): Promise<DeliveryResult[]> {
		const subscriptionIds = this.pinIndex.get(pin);
		if (!subscriptionIds || subscriptionIds.size === 0) {
			return [];
		}

		const basePayload: WebhookPayload<T> = {
			event,
			timestamp: new Date().toISOString(),
			pin,
			data,
		};

		const deliveryPromises: Promise<DeliveryResult>[] = [];

		for (const id of subscriptionIds) {
			const subscription = this.subscriptions.get(id);
			if (!subscription || subscription.status === 'disabled') continue;

			// Filter by client type if specified
			if (options?.targetClientTypes && !options.targetClientTypes.includes(subscription.clientType)) {
				continue;
			}

			// Filter by player ID if specified
			if (options?.targetPlayerId && subscription.clientType === 'player') {
				if (subscription.playerId !== options.targetPlayerId) continue;
			}

			// Use enhanced payload for whiteboard if provided
			let payloadToSend = basePayload;
			if (subscription.clientType === 'whiteboard' && options?.whiteboardEnhancedData) {
				payloadToSend = {
					...basePayload,
					data: options.whiteboardEnhancedData as T,
				};
			}

			const payloadString = JSON.stringify(payloadToSend);
			deliveryPromises.push(this.deliverToSubscription(subscription, payloadString));
		}

		// Execute all deliveries in parallel for lowest latency
		const results = await Promise.all(deliveryPromises);
		
		const successCount = results.filter(r => r.success).length;
		this.logger.debug(
			`Event ${event} delivered to ${successCount}/${results.length} subscriptions for game ${pin}`,
		);

		return results;
	}

	// ============================================
	// High-level Event Emission Methods
	// ============================================

	/**
	 * Emit when a player joins a game
	 */
	async emitPlayerJoined(pin: string, payload: GameJoinedPayload): Promise<void> {
		await this.emit(pin, WebhookEventType.GAME_JOINED, payload, {
			targetClientTypes: ['host', 'whiteboard'],
		});
	}

	/**
	 * Emit when a player leaves a game
	 */
	async emitPlayerLeft(pin: string, payload: PlayerLeftPayload): Promise<void> {
		await this.emit(pin, WebhookEventType.PLAYER_LEFT, payload, {
			targetClientTypes: ['host', 'whiteboard'],
		});
	}

	/**
	 * Emit game state change to all subscribers
	 */
	async emitStateChanged(pin: string, payload: GameStateChangedPayload): Promise<void> {
		await this.emit(pin, WebhookEventType.GAME_STATE_CHANGED, payload);
	}

	/**
	 * Emit question start - sends safe question (no correct answer)
	 */
	async emitQuestionStart(pin: string, payload: QuestionStartPayload): Promise<void> {
		await this.emit(pin, WebhookEventType.QUIZ_QUESTION_START, payload);
	}

	/**
	 * Emit question end with correct answer revealed
	 * Whiteboard gets enhanced payload with distribution stats
	 */
	async emitQuestionEnd(
		pin: string,
		payload: QuestionEndPayload,
		whiteboardPayload?: WhiteboardQuestionEndPayload,
	): Promise<void> {
		await this.emit(pin, WebhookEventType.QUIZ_QUESTION_END, payload, {
			whiteboardEnhancedData: whiteboardPayload,
		});
	}

	/**
	 * Emit individual player feedback (only to that player)
	 */
	async emitPlayerFeedback(pin: string, playerId: string, payload: PlayerFeedbackPayload): Promise<void> {
		await this.emit(pin, WebhookEventType.PLAYER_FEEDBACK, payload, {
			targetPlayerId: playerId,
		});
	}

	/**
	 * Emit leaderboard to all subscribers
	 * Whiteboard gets enhanced payload with rank changes
	 */
	async emitLeaderboard(
		pin: string,
		payload: LeaderboardPayload,
		whiteboardPayload?: WhiteboardLeaderboardPayload,
	): Promise<void> {
		await this.emit(pin, WebhookEventType.GAME_LEADERBOARD, payload, {
			whiteboardEnhancedData: whiteboardPayload,
		});
	}

	/**
	 * Emit game ended to all subscribers
	 */
	async emitGameEnded(pin: string, payload: GameEndedPayload): Promise<void> {
		await this.emit(pin, WebhookEventType.GAME_ENDED, payload);
		
		// Clean up subscriptions after game ends (with small delay for delivery)
		setTimeout(() => this.removeGameSubscriptions(pin), 5000);
	}

	// ============================================
	// Statistics and Diagnostics
	// ============================================

	/**
	 * Get subscription statistics
	 */
	getStats(): {
		totalSubscriptions: number;
		activeSubscriptions: number;
		failedSubscriptions: number;
		gameCount: number;
	} {
		let active = 0;
		let failed = 0;

		for (const sub of this.subscriptions.values()) {
			if (sub.status === 'active') active++;
			else if (sub.status === 'failed') failed++;
		}

		return {
			totalSubscriptions: this.subscriptions.size,
			activeSubscriptions: active,
			failedSubscriptions: failed,
			gameCount: this.pinIndex.size,
		};
	}

	/**
	 * Get subscriptions for a specific game
	 */
	getGameSubscriptions(pin: string): WebhookSubscription[] {
		const ids = this.pinIndex.get(pin);
		if (!ids) return [];

		return Array.from(ids)
			.map(id => this.subscriptions.get(id))
			.filter((sub): sub is WebhookSubscription => sub !== undefined);
	}
}
