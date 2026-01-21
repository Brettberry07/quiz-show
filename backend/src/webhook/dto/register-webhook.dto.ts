import { IsString, IsUrl, IsEnum, IsOptional, MinLength, MaxLength } from 'class-validator';
import { WebhookClientType } from '../webhook.types';

/**
 * DTO for host/whiteboard webhook registration
 */
export class RegisterWebhookDto {
	@IsString()
	@MinLength(6)
	@MaxLength(6)
	pin: string;

	@IsEnum(['host', 'whiteboard'] as const)
	clientType: Extract<WebhookClientType, 'host' | 'whiteboard'>;

	@IsUrl({ require_tld: false }) // Allow localhost for development
	targetUrl: string;

	@IsString()
	@MinLength(16)
	@MaxLength(128)
	secret: string;
}

/**
 * DTO for player webhook registration
 */
export class RegisterPlayerWebhookDto {
	@IsString()
	@MinLength(6)
	@MaxLength(6)
	pin: string;

	@IsUrl({ require_tld: false })
	targetUrl: string;

	@IsString()
	@MinLength(16)
	@MaxLength(128)
	secret: string;

	@IsOptional()
	@IsString()
	recoveryToken?: string; // For reconnection scenarios
}

/**
 * Response DTO for webhook registration
 */
export class WebhookRegistrationResponseDto {
	id: string;
	pin: string;
	clientType: WebhookClientType;
	playerId?: string;
	targetUrl: string;
	status: string;
	createdAt: string;
}

/**
 * Response DTO for webhook details
 */
export class WebhookDetailsResponseDto {
	id: string;
	pin: string;
	clientType: WebhookClientType;
	playerId?: string;
	targetUrl: string;
	status: string;
	createdAt: string;
	lastSeenAt?: string;
	consecutiveFailures: number;
}
