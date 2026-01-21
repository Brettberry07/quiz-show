/**
 * Game Module Types
 * 
 * Core type definitions for the in-memory game state management.
 * Based on ephemeral schema from SysDesign.md Section 5.
 */

export enum GameState {
	LOBBY = 'LOBBY',
	QUESTION_ACTIVE = 'question_active',
	PROCESSING = 'processing',
	LEADERBOARD = 'leaderboard',
	ENDED = 'ended',
}

export enum QuestionType {
	MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
	TRUE_FALSE = 'TRUE_FALSE',
}

/**
 * Simplified Quiz structure for in-memory caching
 * Full Quiz entity lives in QuizModule
 */
export interface CachedQuiz {
	id: string;
	title: string;
	hostId: string;
	questions: CachedQuestion[];
}

export interface CachedQuestion {
	id: string;
	text: string;
	type: QuestionType;
	timeLimitSeconds: number;
	pointsMultiplier: number;
	options: string[];
	correctOptionIndex: number; // Used by GameModule for scoring
}

/**
 * Player answer submission
 */
export interface PlayerAnswer {
	answerIndex: number;
	submissionTime: number; // High-resolution timestamp (process.hrtime.bigint())
}

/**
 * Individual player state within a game
 * Player ID matches the User entity ID from database
 */
export interface PlayerState {
	id: string; // User ID from database (extracted from JWT)
	socketId: string; // Updates on reconnect
	nickname: string;
	totalScore: number;
	currentCombo: number; // Consecutive correct answers
	lastAnswer: PlayerAnswer | null; // Reset every question
}

/**
 * Active game instance living in memory
 * Keyed by PIN in GameService's Map
 */
export interface ActiveGame {
	pin: string;
	quizData: CachedQuiz;
	currentQuestionIndex: number;
	state: GameState;
	
	// High-precision server time when current question opened
	questionStartTime: bigint | null;
	
	// Question timer reference for cleanup
	questionTimer: NodeJS.Timeout | null;
	
	players: Map<string, PlayerState>;
	hostSocketId: string;
	hostUserId: string;
	
	// Timestamps
	createdAt: Date;
	startedAt: Date | null;
}

/**
 * Configuration for score calculation
 */
export interface ScoreConfig {
	basePoints: number;
	minimumPointsRatio: number; // e.g., 0.5 = 50% minimum
	comboBonus: number; // e.g., 0.1 = 10% per streak
	maxComboMultiplier: number; // e.g., 1.5
	graceWindowMs: number; // e.g., 500ms
}

/**
 * Result of score calculation
 */
export interface ScoreResult {
	points: number;
	isCorrect: boolean;
	combo: number;
	elapsedMs: number;
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
	playerId: string;
	nickname: string;
	score: number;
	rank: number;
}

/**
 * DTO interfaces for service methods
 */
export interface CreateGameOptions {
	quizId: string;
	hostUserId: string;
	hostSocketId: string;
}

export interface JoinGameOptions {
	pin: string;
	userId: string; // From JWT token via auth guard
	nickname: string;
	socketId: string;
}

export interface SubmitAnswerOptions {
	pin: string;
	playerId: string;
	answerIndex: number;
}

export interface PlayerJoinResult {
	playerId: string;
	player: PlayerState;
}
