import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { GameModule } from '../game/game.module';
import { JwtModule } from '../jwt/jwt.module';
import { DbModule } from '../db/db.module';

/**
 * WebhookModule - Low-latency event delivery
 *
 * Provides:
 * - In-memory webhook subscription management
 * - HMAC-secured payload delivery
 * - Parallel event emission
 * - Retry with exponential backoff
 *
 * Dependencies:
 * - GameModule: For game validation and state
 * - JwtModule: For authentication guards
 * - HttpModule: For HTTP delivery
 */
@Module({
	imports: [
		HttpModule.register({
			timeout: 2000, // Slightly higher than service timeout for buffer
			maxRedirects: 0, // Don't follow redirects for security
		}),
		GameModule,
		JwtModule,
		DbModule, // Required by JwtAuthGuard
	],
	controllers: [WebhookController],
	providers: [WebhookService],
	exports: [WebhookService],
})
export class WebhookModule {}
