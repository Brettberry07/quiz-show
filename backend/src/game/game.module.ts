import { Module } from '@nestjs/common';
import { GameService } from './game.service';

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
	providers: [GameService],
	exports: [GameService],
})
export class GameModule {}
