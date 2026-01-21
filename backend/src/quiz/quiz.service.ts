/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateQuizDto, CreateQuestionDto } from './dto/create-quiz.dto';
import { UpdateQuizDto, UpdateQuestionDto } from './dto/update-quiz.dto';
import { Quiz, Question } from './quiz.class';
import { CachedQuiz } from '../game/game.types';

@Injectable()
export class QuizService {
  // <PIN, Quiz> for quiz storage
  private readonly quizzes = new Map<string, Quiz>();

  /**
   * Create a new quiz with questions
   * 
   * @param createQuizDto - The quiz data
   * @param hostId - The user ID of the quiz creator
   * @returns The created Quiz object
   */
  createQuiz(createQuizDto: CreateQuizDto, hostId: string): Quiz {
    const quizId = randomUUID();
    
    // Create Question objects from DTO
    const questions = createQuizDto.questions.map(qDto => 
      this.createQuestionFromDto(qDto, quizId)
    );

    const quiz = new Quiz(
      quizId,
      createQuizDto.title,
      hostId,
      questions
    );

    this.quizzes.set(quizId, quiz);
    return quiz;
  }

  /**
   * Helper to create Question from DTO
   */
  private createQuestionFromDto(dto: CreateQuestionDto, quizId: string): Question {
    return new Question(
      randomUUID(),
      quizId,
      dto.text,
      dto.type,
      dto.timeLimitSeconds,
      dto.pointsMultiplier,
      dto.options,
      dto.correctOptionIndex
    );
  }

  /**
   * Get all quizzes (returns summaries for list view)
   * 
   * @returns Array of quiz summaries
   */
  findAll(): ReturnType<Quiz['getSummary']>[] {
    return Array.from(this.quizzes.values()).map(quiz => quiz.getSummary());
  }

  /**
   * Get all quizzes for a specific host
   * 
   * @param hostId - The host user ID
   * @returns Array of quiz summaries owned by the host
   */
  findAllByHost(hostId: string): ReturnType<Quiz['getSummary']>[] {
    return Array.from(this.quizzes.values())
      .filter(quiz => quiz.hostId === hostId)
      .map(quiz => quiz.getSummary());
  }

  /**
   * Get a single quiz by ID (full details including answers)
   * INTERNAL USE ONLY - contains correct answers
   * 
   * @param id - The quiz ID
   * @returns The full Quiz object
   * @throws NotFoundException if quiz doesn't exist
   */
  findOne(id: string): Quiz {
    const quiz = this.quizzes.get(id);
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }
    return quiz;
  }

  /**
   * Get a quiz without correct answers (safe for clients)
   * 
   * @param id - The quiz ID
   * @param requesterId - The user requesting the quiz
   * @returns Quiz with questions but without correct answers (unless requester is the host)
   */
  findOneForClient(id: string, requesterId: string) {
    const quiz = this.findOne(id);
    const isHost = quiz.hostId === requesterId;

    return {
      id: quiz.id,
      title: quiz.title,
      hostId: quiz.hostId,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
      questions: quiz.questions.map(q => ({
        id: q.id,
        text: q.text,
        type: q.type,
        timeLimitSeconds: q.timeLimitSeconds,
        pointsMultiplier: q.pointsMultiplier,
        options: q.options,
        // Only include correct answer if requester is the host
        ...(isHost && { correctOptionIndex: q.correctOptionIndex }),
      })),
    };
  }

  /**
   * Get quiz as CachedQuiz format for GameModule
   * 
   * @param id - The quiz ID
   * @returns CachedQuiz format for game sessions
   * @throws NotFoundException if quiz doesn't exist
   * @throws BadRequestException if quiz is not playable
   */
  getQuizForGame(id: string): CachedQuiz {
    const quiz = this.findOne(id);
    
    const playability = quiz.isPlayable();
    if (!playability.valid) {
      throw new BadRequestException(playability.reason);
    }

    return quiz.toCachedQuiz();
  }

  /**
   * Update a quiz's metadata and/or questions
   * 
   * @param id - The quiz ID
   * @param updateQuizDto - The update data
   * @param requesterId - The user requesting the update
   * @returns The updated Quiz object
   * @throws NotFoundException if quiz doesn't exist
   * @throws ForbiddenException if requester is not the host
   */
  update(id: string, updateQuizDto: UpdateQuizDto, requesterId: string): Quiz {
    const quiz = this.findOne(id);
    
    // Verify ownership
    if (quiz.hostId !== requesterId) {
      throw new ForbiddenException('You can only update your own quizzes');
    }

    // Update title if provided
    if (updateQuizDto.title) {
      quiz.updateTitle(updateQuizDto.title);
    }

    // Update questions if provided
    if (updateQuizDto.questions) {
      this.updateQuestions(quiz, updateQuizDto.questions);
    }

    return quiz;
  }

  /**
   * Helper to update questions in a quiz
   */
  private updateQuestions(quiz: Quiz, questionDtos: UpdateQuestionDto[]): void {
    for (const qDto of questionDtos) {
      if (qDto.id) {
        // Update existing question
        const question = quiz.getQuestion(qDto.id);
        if (question) {
          if (qDto.text !== undefined) question.text = qDto.text;
          if (qDto.type !== undefined) question.type = qDto.type;
          if (qDto.timeLimitSeconds !== undefined) question.timeLimitSeconds = qDto.timeLimitSeconds;
          if (qDto.pointsMultiplier !== undefined) question.pointsMultiplier = qDto.pointsMultiplier;
          if (qDto.options !== undefined) question.options = qDto.options;
          if (qDto.correctOptionIndex !== undefined) question.correctOptionIndex = qDto.correctOptionIndex;
        }
      }
    }
  }

  /**
   * Add a new question to an existing quiz
   * 
   * @param quizId - The quiz ID
   * @param addQuestionDto - The question data
   * @param requesterId - The user requesting the addition
   * @returns The created Question object
   */
  addQuestion(quizId: string, addQuestionDto: CreateQuestionDto, requesterId: string): Question {
    const quiz = this.findOne(quizId);
    
    if (quiz.hostId !== requesterId) {
      throw new ForbiddenException('You can only add questions to your own quizzes');
    }

    const question = this.createQuestionFromDto(addQuestionDto, quizId);
    quiz.addQuestion(question);
    
    return question;
  }

  /**
   * Remove a question from a quiz
   * 
   * @param quizId - The quiz ID
   * @param questionId - The question ID to remove
   * @param requesterId - The user requesting the removal
   * @returns True if removed, false if question not found
   */
  removeQuestion(quizId: string, questionId: string, requesterId: string): boolean {
    const quiz = this.findOne(quizId);
    
    if (quiz.hostId !== requesterId) {
      throw new ForbiddenException('You can only modify your own quizzes');
    }

    return quiz.removeQuestion(questionId);
  }

  /**
   * Delete a quiz entirely
   * 
   * @param id - The quiz ID
   * @param requesterId - The user requesting deletion
   * @returns The deleted Quiz object
   * @throws NotFoundException if quiz doesn't exist
   * @throws ForbiddenException if requester is not the host
   */
  remove(id: string, requesterId: string): Quiz {
    const quiz = this.findOne(id);
    
    if (quiz.hostId !== requesterId) {
      throw new ForbiddenException('You can only delete your own quizzes');
    }

    this.quizzes.delete(id);
    return quiz;
  }

  /**
   * Check if a quiz exists
   * 
   * @param id - The quiz ID
   * @returns True if quiz exists
   */
  exists(id: string): boolean {
    return this.quizzes.has(id);
  }

  /**
   * Validate that a quiz is ready to be played
   * 
   * @param id - The quiz ID
   * @returns Validation result with reason if invalid
   */
  validateForGame(id: string): { valid: boolean; reason?: string } {
    const quiz = this.findOne(id);
    return quiz.isPlayable();
  }

  /**
   * Get quiz statistics
   * 
   * @returns Stats about stored quizzes
   */
  getStats() {
    const quizzes = Array.from(this.quizzes.values());
    const totalQuestions = quizzes.reduce((sum, q) => sum + q.getQuestionCount(), 0);
    
    return {
      totalQuizzes: this.quizzes.size,
      totalQuestions,
      averageQuestionsPerQuiz: this.quizzes.size > 0 
        ? Math.round(totalQuestions / this.quizzes.size * 10) / 10 
        : 0,
    };
  }
}
