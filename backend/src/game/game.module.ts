import { Module, forwardRef } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { QuizModule } from '../quiz/quiz.module';
import { AuthModule } from '../auth/auth.module';
import { GameGateway } from './game.gateway';
import { GameEventsService } from './game-events.service';
import { WsJwtGuard } from '../auth/ws-jwt.guard';

/**
 * GameModule - Core Game Domain
 * 
 * Provides:
 * - In-memory game state management
 * - Game lifecycle control
 * - Player management
 * - Scoring logic
 * - Timer management
 * 
 * This module is consumed by:
 * - WebSocketModule (for real-time events)
 * - QuizModule (for quiz data)
 */
@Module({
	imports: [forwardRef(() => QuizModule), AuthModule],
	controllers: [GameController],
	providers: [GameService, GameGateway, GameEventsService, WsJwtGuard],
	exports: [GameService],
})
export class GameModule {}
