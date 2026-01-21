import { QuestionType } from '../game/game.types';

/**
 * Question Class - Represents a single question in a quiz
 */
export class Question {
	public readonly id: string;
	public readonly quizId: string;
	public text: string;
	public type: QuestionType;
	public timeLimitSeconds: number;
	public pointsMultiplier: number;
	public options: string[];
	public correctOptionIndex: number;

	constructor(
		id: string,
		quizId: string,
		text: string,
		type: QuestionType,
		timeLimitSeconds: number,
		pointsMultiplier: number,
		options: string[],
		correctOptionIndex: number
	) {
		this.id = id;
		this.quizId = quizId;
		this.text = text;
		this.type = type;
		this.timeLimitSeconds = timeLimitSeconds;
		this.pointsMultiplier = pointsMultiplier;
		this.options = options;
		this.correctOptionIndex = correctOptionIndex;
	}

	/**
	 * Get question without revealing the answer (for active gameplay)
	 */
	getSafeQuestion() {
		return {
			id: this.id,
			text: this.text,
			type: this.type,
			timeLimitSeconds: this.timeLimitSeconds,
			pointsMultiplier: this.pointsMultiplier,
			options: this.options,
		};
	}

	/**
	 * Validate an answer index
	 */
	isValidAnswerIndex(index: number): boolean {
		return index >= 0 && index < this.options.length;
	}

	/**
	 * Check if an answer is correct
	 */
	isCorrectAnswer(index: number): boolean {
		return index === this.correctOptionIndex;
	}
}

/**
 * Quiz Class - Represents a complete quiz with all questions
 * 
 * This is the domain model that:
 * - Persists to SQLite via TypeORM entities
 * - Gets converted to CachedQuiz format when a game starts
 * - Manages quiz metadata and question collection
 */
export class Quiz {
	public readonly id: string;
	public title: string;
	public readonly hostId: string;
	public questions: Question[];
	public readonly createdAt: Date;
	public updatedAt: Date;

	constructor(
		id: string,
		title: string,
		hostId: string,
		questions: Question[] = [],
		createdAt?: Date,
		updatedAt?: Date
	) {
		this.id = id;
		this.title = title;
		this.hostId = hostId;
		this.questions = questions;
		this.createdAt = createdAt || new Date();
		this.updatedAt = updatedAt || new Date();
	}

	/**
	 * Add a question to the quiz
	 */
	addQuestion(question: Question): void {
		this.questions.push(question);
		this.updatedAt = new Date();
	}

	/**
	 * Remove a question by ID
	 */
	removeQuestion(questionId: string): boolean {
		const initialLength = this.questions.length;
		this.questions = this.questions.filter(q => q.id !== questionId);
		
		if (this.questions.length < initialLength) {
			this.updatedAt = new Date();
			return true;
		}
		return false;
	}

	/**
	 * Get a specific question by ID
	 */
	getQuestion(questionId: string): Question | undefined {
		return this.questions.find(q => q.id === questionId);
	}

	/**
	 * Get question count
	 */
	getQuestionCount(): number {
		return this.questions.length;
	}

	/**
	 * Update quiz title
	 */
	updateTitle(newTitle: string): void {
		this.title = newTitle;
		this.updatedAt = new Date();
	}

	/**
	 * Convert to CachedQuiz format for GameModule
	 * This strips down to only essential runtime data needed for gameplay
	 * Note: correctOptionIndex is included for server-side answer validation
	 */
	toCachedQuiz() {
		return {
			id: this.id,
			title: this.title,
			hostId: this.hostId,
			questions: this.questions.map(q => ({
				id: q.id,
				text: q.text,
				type: q.type,
				timeLimitSeconds: q.timeLimitSeconds,
				pointsMultiplier: q.pointsMultiplier,
				options: q.options,
				correctOptionIndex: q.correctOptionIndex,
			})),
		};
	}

	/**
	 * Get quiz summary (without questions)
	 */
	getSummary() {
		return {
			id: this.id,
			title: this.title,
			hostId: this.hostId,
			questionCount: this.questions.length,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}

	/**
	 * Validate that quiz is ready to be played
	 */
	isPlayable(): { valid: boolean; reason?: string } {
		if (this.questions.length === 0) {
			return { valid: false, reason: 'Quiz must have at least one question' };
		}

		for (const question of this.questions) {
			if (question.options.length < 2) {
				return { 
					valid: false, 
					reason: `Question "${question.text}" must have at least 2 options` 
				};
			}

			if (!question.isValidAnswerIndex(question.correctOptionIndex)) {
				return { 
					valid: false, 
					reason: `Question "${question.text}" has invalid correct answer index` 
				};
			}

			if (question.timeLimitSeconds <= 0) {
				return { 
					valid: false, 
					reason: `Question "${question.text}" must have positive time limit` 
				};
			}
		}

		return { valid: true };
	}
}
