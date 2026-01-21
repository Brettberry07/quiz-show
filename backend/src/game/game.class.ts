import { Logger, BadRequestException } from '@nestjs/common';
import {
	GameState,
	PlayerState,
	CachedQuiz,
	CachedQuestion,
	ScoreConfig,
	ScoreResult,
	LeaderboardEntry,
} from './game.types';

/**
 * Game Class - Encapsulates a single active game session
 * 
 * Manages:
 * - Game state and lifecycle
 * - Player collection
 * - Question flow and timing
 * - Score calculation
 */
export class Game {
	private readonly logger = new Logger(Game.name);
	
	public readonly pin: string;
	public readonly hostUserId: string;
	public hostSocketId: string; 
	public readonly createdAt: Date;
	
	private readonly quizData: CachedQuiz; // TODO: Convert to Quiz Object from QuizModule once implemented
	private currentQuestionIndex: number;

	public state: GameState;
	public questionStartTime: bigint | null;
	public startedAt: Date | null;
	
	private questionTimer: NodeJS.Timeout | null;
	private readonly players: Map<string, PlayerState>;
	private readonly scoreConfig: ScoreConfig;
	private cachedSafeQuestion: Omit<CachedQuestion, 'correctOptionIndex'> | null;

	constructor(
		pin: string,
		quizData: CachedQuiz,
		hostUserId: string,
		hostSocketId: string,
		scoreConfig: ScoreConfig
	) {
		this.pin = pin;
		this.quizData = quizData;
		this.hostUserId = hostUserId;
		this.hostSocketId = hostSocketId;
		this.scoreConfig = scoreConfig;
		
		this.currentQuestionIndex = -1; // Not started
		this.state = GameState.LOBBY;
		this.questionStartTime = null;
		this.questionTimer = null;
		this.players = new Map(); // Players in the Lobby
		this.createdAt = new Date();
		this.startedAt = null;
		this.cachedSafeQuestion = null;
	}

	/**
	 * Add a player to the game
	 */
	addPlayer(userId: string, nickname: string, socketId: string): PlayerState {
		if (this.state !== GameState.LOBBY) throw new BadRequestException('Game has already started');

		if (this.players.has(userId)) throw new BadRequestException('You are already in this game');

		const player: PlayerState = {
			id: userId,
			socketId,
			nickname,
			totalScore: 0,
			currentCombo: 0,
			lastAnswer: null,
		};

		this.players.set(userId, player);
		this.logger.log(`Player ${nickname} (${userId}) joined game ${this.pin}`);

		return player;
	}

	/**
	 * Remove a player from the game
	 */
	removePlayer(userId: string): void {
		if (this.players.delete(userId)) {
			this.logger.log(`Player ${userId} removed from game ${this.pin}`);
			return;
		}
		throw new BadRequestException(`Player ${userId} not found in game`);
	}

	/**
	 * Update player's socket ID for reconnection
	 */
	updatePlayerSocket(userId: string, newSocketId: string): void {
		const player = this.players.get(userId);
		if (!player) {
			throw new BadRequestException(`Player ${userId} not found in game`);
		}
		player.socketId = newSocketId;
	}

	/**
	 * Get a player by user ID
	 */
	getPlayer(userId: string): PlayerState | undefined {
		return this.players.get(userId);
	}

	/**
	 * Get all players
	 */
	getPlayers(): PlayerState[] {
		return Array.from(this.players.values());
	}

	/**
	 * Get player count
	 */
	getPlayerCount(): number {
		return this.players.size;
	}

	/**
	 * Start the game - transition from LOBBY to first question
	 */
	start(onQuestionEnd: (pin: string) => void): void {
		if (this.state !== GameState.LOBBY) {
			throw new BadRequestException('Game has already started');
		}

		if (this.players.size === 0) {
			throw new BadRequestException('Cannot start game with no players');
		}

		this.startedAt = new Date();
		this.currentQuestionIndex = 0;
		this.state = GameState.QUESTION_ACTIVE;
		this.questionStartTime = process.hrtime.bigint();
		this.cacheCurrentSafeQuestion();

		const currentQuestion = this.getCurrentQuestionInternal();
		if (currentQuestion) {
			this.scheduleQuestionEnd(currentQuestion.timeLimitSeconds, onQuestionEnd);
		}

		this.logger.log(`Game ${this.pin} started with ${this.players.size} players`);
	}

	/**
	 * Cache the current question without the correct answer
	 * Called when a question becomes active
	 */
	private cacheCurrentSafeQuestion(): void {
		const question = this.getCurrentQuestionInternal();
		if (question) {
			const { correctOptionIndex, ...safeQuestion } = question;
			this.cachedSafeQuestion = safeQuestion;
		} else {
			this.cachedSafeQuestion = null;
		}
	}

	/**
	 * Schedule automatic question end
	 */
	private scheduleQuestionEnd(timeLimitSeconds: number, onQuestionEnd: (pin: string) => void): void {
		if (this.questionTimer) {
			clearTimeout(this.questionTimer);
		}

		const totalMs = (timeLimitSeconds * 1000) + this.scoreConfig.graceWindowMs;

		this.questionTimer = setTimeout(() => {
			onQuestionEnd(this.pin);
		}, totalMs);
	}

	/**
	 * Submit an answer from a player
	 */
	submitAnswer(userId: string, answerIndex: number): ScoreResult {
		if (this.state !== GameState.QUESTION_ACTIVE) {
			throw new BadRequestException('No active question to answer');
		}

		const player = this.players.get(userId);
		if (!player) {
			throw new BadRequestException(`Player ${userId} not found`);
		}

		if (player.lastAnswer !== null) {
			throw new BadRequestException('Answer already submitted for this question');
		}

		const currentQuestion = this.getCurrentQuestionInternal();
		if (!currentQuestion) {
			throw new BadRequestException('No active question');
		}
		const submissionTime = process.hrtime.bigint();

		if (answerIndex < 0 || answerIndex >= currentQuestion.options.length) {
			throw new BadRequestException('Invalid answer index');
		}

		const elapsedNs = submissionTime - (this.questionStartTime || 0n);
		const elapsedMs = Number(elapsedNs) / 1_000_000;

		const maxAllowedMs = (currentQuestion.timeLimitSeconds * 1000) + this.scoreConfig.graceWindowMs;
		if (elapsedMs > maxAllowedMs) {
			throw new BadRequestException('Answer submitted after time limit');
		}

		player.lastAnswer = {
			answerIndex,
			submissionTime: Number(submissionTime),
		};

		const scoreResult = this.calculateScore(
			currentQuestion,
			elapsedMs,
			answerIndex,
			player.currentCombo
		);

		if (scoreResult.isCorrect) {
			player.currentCombo++;
		} else {
			player.currentCombo = 0;
		}

		player.totalScore += scoreResult.points;

		this.logger.log(
			`Player ${player.nickname} answered Q${this.currentQuestionIndex} ` +
			`in ${elapsedMs.toFixed(0)}ms: ${scoreResult.isCorrect ? 'CORRECT' : 'WRONG'} ` +
			`(+${scoreResult.points} pts, combo: ${player.currentCombo})`
		);

		return scoreResult;
	}

	/**
	 * Calculate score based on correctness, speed, and combo
	 */
	private calculateScore(
		question: CachedQuestion,
		elapsedMs: number,
		answerIndex: number,
		currentCombo: number
	): ScoreResult {
		const isCorrect = answerIndex === question.correctOptionIndex;

		if (!isCorrect) {
			return {
				points: 0,
				isCorrect: false,
				combo: 0,
				elapsedMs,
			};
		}

		const elapsedSeconds = elapsedMs / 1000;
		const timeRatio = 1 - (elapsedSeconds / question.timeLimitSeconds / 2);
		const rawScore = Math.round(this.scoreConfig.basePoints * timeRatio);

		const comboMultiplier = Math.min(
			1 + (currentCombo * this.scoreConfig.comboBonus),
			this.scoreConfig.maxComboMultiplier
		);

		const finalScore = Math.floor(rawScore * comboMultiplier * question.pointsMultiplier);

		return {
			points: finalScore,
			isCorrect: true,
			combo: currentCombo + 1,
			elapsedMs,
		};
	}

	/**
	 * End the current question
	 */
	endCurrentQuestion(): void {
		if (this.state !== GameState.QUESTION_ACTIVE) {
			throw new BadRequestException('No active question to end');
		}

		if (this.questionTimer) {
			clearTimeout(this.questionTimer);
			this.questionTimer = null;
		}

		this.state = GameState.PROCESSING;
		this.questionStartTime = null;
		this.cachedSafeQuestion = null;

		this.logger.log(`Question ${this.currentQuestionIndex} ended for game ${this.pin}`);
	}

	/**
	 * Show leaderboard
	 */
	showLeaderboard(): void {
		if (this.state !== GameState.PROCESSING) {
			throw new BadRequestException('Cannot show leaderboard in current state');
		}

		this.state = GameState.LEADERBOARD;
		this.logger.log(`Showing leaderboard for game ${this.pin}`);
	}

	/**
	 * Advance to next question or end game
	 */
	nextQuestion(onQuestionEnd: (pin: string) => void): boolean {
		if (this.state !== GameState.LEADERBOARD) {
			throw new BadRequestException('Cannot advance from current state');
		}

		// Check if there are more questions
		if (this.currentQuestionIndex >= this.quizData.questions.length - 1) {
			this.end();
			return false; // Game ended
		}

		// Reset player answers
		this.players.forEach(player => {
			player.lastAnswer = null;
		});

		// Advance to next question
		this.currentQuestionIndex++;
		this.state = GameState.QUESTION_ACTIVE;
		this.questionStartTime = process.hrtime.bigint();
		this.cacheCurrentSafeQuestion();

		const currentQuestion = this.getCurrentQuestionInternal();
		if (currentQuestion) {
			this.scheduleQuestionEnd(currentQuestion.timeLimitSeconds, onQuestionEnd);
		}

		this.logger.log(`Game ${this.pin} advanced to question ${this.currentQuestionIndex + 1}`);
		
		return true; // More questions remain
	}

	/**
	 * End the game
	 */
	end(): void {
		if (this.questionTimer) {
			clearTimeout(this.questionTimer);
			this.questionTimer = null;
		}

		this.state = GameState.ENDED;
		this.logger.log(`Game ${this.pin} ended`);
	}

	/**
	 * Clean up resources
	 */
	destroy(): void {
		if (this.questionTimer) {
			clearTimeout(this.questionTimer);
			this.questionTimer = null;
		}
		this.players.clear();
		this.logger.log(`Game ${this.pin} destroyed`);
	}

	/**
	 * Get current question without revealing the correct answer (for client display)
	 * Returns cached version to avoid repeated object creation
	 */
	getCurrentQuestion(): Omit<CachedQuestion, 'correctOptionIndex'> | null {
		return this.cachedSafeQuestion;
	}

	/**
	 * Get current question with answer (server-side only for validation)
	 * @internal Used only by internal game logic for answer checking
	 */
	private getCurrentQuestionInternal(): CachedQuestion | null {
		if (this.currentQuestionIndex < 0 || this.currentQuestionIndex >= this.quizData.questions.length) {
			return null;
		}
		return this.quizData.questions[this.currentQuestionIndex];
	}

	/**
	 * Get the correct answer for the current question
	 * Only call this after question has ended to reveal answer to clients
	 */
	getCorrectAnswer(): number | null {
		const question = this.getCurrentQuestionInternal();
		return question ? question.correctOptionIndex : null;
	}

	/**
	 * Get leaderboard
	 */
	getLeaderboard(limit: number = 5): LeaderboardEntry[] {
		const sorted = Array.from(this.players.values())
			.sort((a, b) => b.totalScore - a.totalScore);

		return sorted.slice(0, limit).map((player, index) => ({
			playerId: player.id,
			nickname: player.nickname,
			score: player.totalScore,
			rank: index + 1,
		}));
	}

	/**
	 * Get player's rank
	 */
	getPlayerRank(userId: string): number {
		const sorted = Array.from(this.players.values())
			.sort((a, b) => b.totalScore - a.totalScore);

		return sorted.findIndex(p => p.id === userId) + 1;
	}

	/**
	 * Check if user is the host
	 */
	isHost(userId: string): boolean {
		return this.hostUserId === userId;
	}

	/**
	 * Get game summary
	 */
	getSafeSummary() {
		return {
			pin: this.pin,
			state: this.state,
			playerCount: this.players.size,
			quizTitle: this.quizData.title,
		};
	}
}
