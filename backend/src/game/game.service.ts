import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import {
	PlayerState,
	CachedQuiz,
	CreateGameOptions,
	JoinGameOptions,
	SubmitAnswerOptions,
	PlayerJoinResult,
	ScoreConfig,
	ScoreResult,
	LeaderboardEntry,
	CachedQuestion,
} from './game.types';
import { Game } from './game.class';

/**
 * GameService - Core Game Manager
 * 
 * Responsibilities:
 * - Game lifecycle (create, start, end)
 * - Player management (join, leave, reconnect)
 * - State machine transitions
 * - Scoring calculation
 * - Timer management
 * - In-memory game storage
 */
@Injectable()
export class GameService {
	private readonly logger = new Logger(GameService.name);
	
	// <PIN, Game> for PIN -> game lookup
	private readonly activeGames = new Map<string, Game>();
	
	// <Player ID, Game PIN> for player -> game lookup
	private readonly playerGameMap = new Map<string, string>();
	
	// Default scoring configuration
	private readonly scoreConfig: ScoreConfig = {
		basePoints: 1000,
		minimumPointsRatio: 0.5,
		comboBonus: 0.1,
		maxComboMultiplier: 1.5,
		graceWindowMs: 500,
	};

	/**
     * Generates a room's unique 6-digit PIN
	 */
	private generateRoomPin(): string {
		let pin: string;
		let attempts = 0;
		const maxAttempts = 100;
		
		do {
			pin = Math.floor(100000 + Math.random() * 900000).toString();
			attempts++;
			if (attempts > maxAttempts) {
				throw new Error('Unable to generate unique PIN');
			}
		} while (this.activeGames.has(pin));
		
		return pin;
	}



	/**
	 * Create a new game session
	 * TODO: Convert CachedQuiz to Quiz Object made by QuizModule
     * 
	 * @param quiz - The quiz data (fetched by caller from QuizModule)
	 * @param options - Host user ID and socket ID
	 * @returns The created game with PIN
	 */
	createGame(quiz: CachedQuiz, options: CreateGameOptions): { pin: string; state: string; playerCount: number; quizTitle: string; } {
		const pin = this.generateRoomPin();
		
		const game = new Game(
			pin,
			quiz,
			options.hostUserId,
			options.hostSocketId,
			this.scoreConfig
		);
		
		this.activeGames.set(pin, game);
		this.logger.log(`Game created with PIN: ${pin} for quiz: ${quiz.title}`);
		
		return game.getSafeSummary();
	}

	/**
	 * Get a game by PIN
     * 
     * @param pin - The game's PIN
     * @returns The active game
	 */
	getGame(pin: string): Game {
        if (pin.length !== 6) throw new BadRequestException('Invalid PIN format');

		const game = this.activeGames.get(pin);
		if (!game) {
			throw new NotFoundException(`Game with PIN ${pin} not found`);
		}
		return game;
	}

	/**
	 * Add a player to a game 
     * @param options - Player join options 
     * @return Player join result containing PlayerID and PlayerState
	 */
	addPlayer(options: JoinGameOptions): PlayerJoinResult {
		const game = this.getGame(options.pin);
        const player = game.addPlayer(options.userId, options.nickname, options.socketId);

        this.playerGameMap.set(options.userId, options.pin);
		return {
            playerId: player.id,
			player: player,
		};
	}

	/**
	 * Remove a player from a game
     * @param pin - The game's PIN
     * @param playerId - The player's ID
	 */
	removePlayer(pin: string, playerId: string): void {
		const game = this.getGame(pin);
		
		game.removePlayer(playerId);
		this.playerGameMap.delete(playerId);
	}

	/**
	 * Update player's socket ID for reconnections
     * @param pin - The game's PIN
     * @param playerId - The player's ID
     * @param newSocketId - The new socket ID
	 */
	updatePlayerSocket(pin: string, playerId: string, newSocketId: string): void {
		const game = this.getGame(pin);
		game.updatePlayerSocket(playerId, newSocketId);
	}

	/**
	 * Start the game - transition from LOBBY to first question
     * @param pin - The game's PIN
     * @return The started game
	 */
	startGame(pin: string): Game {
		const game = this.getGame(pin);
		game.start((pin) => this.endCurrentQuestion(pin));
		return game;
	}

	/**
	 * Process answer submission from a player
     * 
     * @param options - The answer submission options
     * @return ScoreResult type for the submission
	 */
	submitAnswer(options: SubmitAnswerOptions): ScoreResult {
		const game = this.getGame(options.pin);
		return game.submitAnswer(options.playerId, options.answerIndex);
	}

	/**
	 * End the current question and transition to PROCESSING state
     * @param pin - The Game's six digit pin
	 */
	endCurrentQuestion(pin: string): void {
		const game = this.getGame(pin);
		game.endCurrentQuestion();
	}

	/**
	 * Move to leaderboard state
     * @param pin - The Game's six digit pin
	 */
	showLeaderboard(pin: string): void {
		const game = this.getGame(pin);
		game.showLeaderboard();
	}
    
	/**
	 * Advance to the next question
	 */
	nextQuestion(pin: string): void {
		const game = this.getGame(pin);
		game.nextQuestion((pin) => this.endCurrentQuestion(pin));
	}

	/**
	 * End the game
     * 
     * @param pin - The Game's Six digit PIN
	 */
	endGame(pin: string): void {
		const game = this.getGame(pin);
		game.end();
	}

	/**
	 * Clean up and remove a game from memory
     * 
     * @param pin - The Game's Six digit PIN
	 */
	deleteGame(pin: string): void {
		const game = this.activeGames.get(pin);
		
		if (game) {
			// Remove player mappings
			game.getPlayers().forEach(player => {
				this.playerGameMap.delete(player.id);
			});
			
			game.destroy();
			this.activeGames.delete(pin);
		}
	}

	/**
	 * Get current leaderboard
     * @param pin - The game's PIN
     * @param limit - Number of top players to return (default 5)
     * 
     * @return Array of LeaderboardEntry
	 */
	getLeaderboard(pin: string, limit: number = 5): LeaderboardEntry[] {
		const game = this.getGame(pin);
		return game.getLeaderboard(limit);
	}

	/**
	 * Get player's current rank
     * @param pin - The game's PIN
     * @param playerId - The player's ID
     * 
     * @return The player's rank
	 */
	getPlayerRank(pin: string, playerId: string): number {
		const game = this.getGame(pin);
		return game.getPlayerRank(playerId);
	}

	/**
	 * Get all players in a game
     * 
     * @param pin - The game's PIN
     * @return Array of PlayerState
	 */
	getPlayers(pin: string): PlayerState[] {
		const game = this.getGame(pin);
		return game.getPlayers();
	}

	/**
	 * Get current question (without answer for players)
     * 
     * @param pin - The game's PIN
     * @return The current question or null if none
	 */
	getCurrentQuestion(pin: string): Omit<CachedQuestion, 'correctOptionIndex'> | null {
		const game = this.getGame(pin);
		return game.getCurrentQuestion();
	}

	/**
	 * Get the correct answer for the current question
	 * Only call after question has ended to reveal to clients
     * 
     * @param pin - The game's PIN
     * @return The correct answer index or null
	 */
	getCorrectAnswer(pin: string): number | null {
		const game = this.getGame(pin);
		return game.getCorrectAnswer();
	}

	/**
	 * Get game statistics
     * 
     * @return Object containing active games count, total players count, and game summaries
	 */
	getGameStats() {
		return {
			activeGames: this.activeGames.size,
			totalPlayers: this.playerGameMap.size,
			games: Array.from(this.activeGames.values()).map(game => game.getSafeSummary()),
		};
	}
}
