/**
 * Webhook Module Types
 *
 * Core type definitions for webhook subscription management
 * and event delivery based on WebHook.md specification.
 */

/**
 * Client types that can subscribe to webhooks
 */
export type WebhookClientType = 'host' | 'player' | 'whiteboard';

/**
 * Subscription status for tracking delivery health
 */
export type WebhookSubscriptionStatus = 'active' | 'failed' | 'disabled';

/**
 * Webhook event types matching SysDesign.md events
 */
export enum WebhookEventType {
	GAME_JOINED = 'game.joined',
	GAME_STATE_CHANGED = 'game.state_changed',
	QUIZ_QUESTION_START = 'quiz.question_start',
	QUIZ_QUESTION_END = 'quiz.question_end',
	PLAYER_FEEDBACK = 'player.feedback',
	GAME_LEADERBOARD = 'game.leaderboard',
	PLAYER_LEFT = 'player.left',
	GAME_ENDED = 'game.ended',
}

/**
 * Webhook subscription stored in memory
 */
export interface WebhookSubscription {
	id: string;
	pin: string;
	clientType: WebhookClientType;
	playerId?: string; // Only for player subscriptions
	targetUrl: string;
	secret: string; // For HMAC signature
	createdAt: Date;
	lastSeenAt?: Date;
	status: WebhookSubscriptionStatus;
	consecutiveFailures: number;
}

/**
 * Webhook event payload envelope
 */
export interface WebhookPayload<T = unknown> {
	event: WebhookEventType;
	timestamp: string;
	pin: string;
	data: T;
}

/**
 * Webhook delivery headers
 */
export interface WebhookHeaders {
	'X-Webhook-Id': string;
	'X-Webhook-Timestamp': string;
	'X-Webhook-Signature': string;
	'Content-Type': 'application/json';
	[key: string]: string; // Index signature for Axios compatibility
}

/**
 * Delivery result for tracking
 */
export interface DeliveryResult {
	subscriptionId: string;
	success: boolean;
	statusCode?: number;
	error?: string;
	durationMs: number;
}

// ============================================
// Event-specific payload types
// ============================================

export interface GameJoinedPayload {
	playerId: string;
	nickname: string;
	playerCount: number;
}

export interface GameStateChangedPayload {
	previousState: string;
	currentState: string;
	currentQuestionIndex?: number;
}

export interface QuestionStartPayload {
	questionIndex: number;
	questionId: string;
	text: string;
	type: string;
	options: string[];
	timeLimitSeconds: number;
	pointsMultiplier: number;
}

export interface QuestionEndPayload {
	questionIndex: number;
	questionId: string;
	correctOptionIndex: number;
	answerDistribution: Record<number, number>; // optionIndex -> count
}

export interface PlayerFeedbackPayload {
	playerId: string;
	isCorrect: boolean;
	points: number;
	combo: number;
	elapsedMs: number;
	newTotalScore: number;
}

export interface LeaderboardPayload {
	entries: Array<{
		playerId: string;
		nickname: string;
		score: number;
		rank: number;
	}>;
	questionIndex: number;
}

export interface PlayerLeftPayload {
	playerId: string;
	nickname: string;
	playerCount: number;
}

export interface GameEndedPayload {
	finalLeaderboard: Array<{
		playerId: string;
		nickname: string;
		score: number;
		rank: number;
	}>;
	totalQuestions: number;
	duration: number; // Game duration in seconds
}

// ============================================
// Whiteboard-specific enhanced payloads
// ============================================

export interface WhiteboardQuestionEndPayload extends QuestionEndPayload {
	answerDistribution: Record<number, number>;
	averageResponseTime: number;
	fastestPlayer?: {
		playerId: string;
		nickname: string;
		elapsedMs: number;
	};
}

export interface WhiteboardLeaderboardPayload extends LeaderboardPayload {
	previousRankings?: Record<string, number>; // playerId -> previous rank
	scoreChanges?: Record<string, number>; // playerId -> points gained this round
}
