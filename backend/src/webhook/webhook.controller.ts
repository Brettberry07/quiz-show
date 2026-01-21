import {
	Controller,
	Post,
	Get,
	Delete,
	Body,
	Param,
	UseGuards,
	Req,
	ForbiddenException,
	BadRequestException,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { GameService } from '../game/game.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
	RegisterWebhookDto,
	RegisterPlayerWebhookDto,
	WebhookRegistrationResponseDto,
	WebhookDetailsResponseDto,
} from './dto';

interface AuthenticatedRequest {
	user: {
		id: string;
		username: string;
	};
}

/**
 * WebhookController - Webhook registration and management endpoints
 *
 * Endpoints:
 * - POST /webhooks/register - Register host/whiteboard webhook
 * - POST /webhooks/register/player - Register player webhook
 * - GET /webhooks/:id - Get webhook details (host only)
 * - DELETE /webhooks/:id - Remove webhook subscription
 */
@Controller('webhooks')
export class WebhookController {
	constructor(
		private readonly webhookService: WebhookService,
		private readonly gameService: GameService,
	) {}

	/**
	 * Register a host or whiteboard webhook subscription
	 * Requires JWT authentication and host ownership verification
	 */
	@Post('register')
	@UseGuards(JwtAuthGuard)
	registerWebhook(
		@Body() dto: RegisterWebhookDto,
		@Req() req: AuthenticatedRequest,
	): WebhookRegistrationResponseDto {
		const userId = req.user.id;

		// Validate game exists
		const game = this.gameService.getGame(dto.pin);

		// Only host can register host/whiteboard webhooks
		if (game.hostUserId !== userId) {
			throw new ForbiddenException('Only the host can register webhooks for this game');
		}

		const subscription = this.webhookService.registerSubscription(
			dto.pin,
			dto.clientType,
			dto.targetUrl,
			dto.secret,
		);

		return this.toRegistrationResponse(subscription);
	}

	/**
	 * Register a player-specific webhook subscription
	 * Requires JWT authentication and validates player is in the game
	 */
	@Post('register/player')
	@UseGuards(JwtAuthGuard)
	registerPlayerWebhook(
		@Body() dto: RegisterPlayerWebhookDto,
		@Req() req: AuthenticatedRequest,
	): WebhookRegistrationResponseDto {
		const playerId = req.user.id;

		// Validate game exists
		const game = this.gameService.getGame(dto.pin);

		// Validate player is in the game
		const player = game.getPlayer(playerId);
		if (!player) {
			throw new BadRequestException('You must join the game before registering a webhook');
		}

		const subscription = this.webhookService.registerPlayerSubscription(
			dto.pin,
			playerId,
			dto.targetUrl,
			dto.secret,
		);

		return this.toRegistrationResponse(subscription);
	}

	/**
	 * Get webhook subscription details
	 * Only accessible by the game host
	 */
	@Get(':id')
	@UseGuards(JwtAuthGuard)
	getWebhook(
		@Param('id') id: string,
		@Req() req: AuthenticatedRequest,
	): WebhookDetailsResponseDto {
		const userId = req.user.id;
		const subscription = this.webhookService.getSubscription(id);

		// Validate host ownership
		const game = this.gameService.getGame(subscription.pin);
		if (game.hostUserId !== userId) {
			throw new ForbiddenException('Only the host can view webhook details');
		}

		return this.toDetailsResponse(subscription);
	}

	/**
	 * Delete a webhook subscription
	 * Accessible by game host or the player who owns the subscription
	 */
	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	deleteWebhook(
		@Param('id') id: string,
		@Req() req: AuthenticatedRequest,
	): { success: boolean; message: string } {
		const userId = req.user.id;
		const subscription = this.webhookService.getSubscription(id);

		// Check if user is the host
		const game = this.gameService.getGame(subscription.pin);
		const isHost = game.hostUserId === userId;

		// Check if user is the player who owns this subscription
		const isOwner = subscription.clientType === 'player' && subscription.playerId === userId;

		if (!isHost && !isOwner) {
			throw new ForbiddenException('You do not have permission to delete this webhook');
		}

		this.webhookService.removeSubscription(id);

		return {
			success: true,
			message: 'Webhook subscription removed',
		};
	}

	/**
	 * Get all webhooks for a game (host only)
	 */
	@Get('game/:pin')
	@UseGuards(JwtAuthGuard)
	getGameWebhooks(
		@Param('pin') pin: string,
		@Req() req: AuthenticatedRequest,
	): WebhookDetailsResponseDto[] {
		const userId = req.user.id;

		// Validate host ownership
		const game = this.gameService.getGame(pin);
		if (game.hostUserId !== userId) {
			throw new ForbiddenException('Only the host can view game webhooks');
		}

		const subscriptions = this.webhookService.getGameSubscriptions(pin);
		return subscriptions.map(sub => this.toDetailsResponse(sub));
	}

	/**
	 * Get webhook service statistics (for monitoring)
	 */
	@Get('stats')
	@UseGuards(JwtAuthGuard)
	getStats(): {
		totalSubscriptions: number;
		activeSubscriptions: number;
		failedSubscriptions: number;
		gameCount: number;
	} {
		return this.webhookService.getStats();
	}

	// ============================================
	// Response Mapping Helpers
	// ============================================

	private toRegistrationResponse(subscription: {
		id: string;
		pin: string;
		clientType: string;
		playerId?: string;
		targetUrl: string;
		status: string;
		createdAt: Date;
	}): WebhookRegistrationResponseDto {
		return {
			id: subscription.id,
			pin: subscription.pin,
			clientType: subscription.clientType as 'host' | 'player' | 'whiteboard',
			playerId: subscription.playerId,
			targetUrl: subscription.targetUrl,
			status: subscription.status,
			createdAt: subscription.createdAt.toISOString(),
		};
	}

	private toDetailsResponse(subscription: {
		id: string;
		pin: string;
		clientType: string;
		playerId?: string;
		targetUrl: string;
		status: string;
		createdAt: Date;
		lastSeenAt?: Date;
		consecutiveFailures: number;
	}): WebhookDetailsResponseDto {
		return {
			id: subscription.id,
			pin: subscription.pin,
			clientType: subscription.clientType as 'host' | 'player' | 'whiteboard',
			playerId: subscription.playerId,
			targetUrl: subscription.targetUrl,
			status: subscription.status,
			createdAt: subscription.createdAt.toISOString(),
			lastSeenAt: subscription.lastSeenAt?.toISOString(),
			consecutiveFailures: subscription.consecutiveFailures,
		};
	}
}
