import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { CreateQuizDto, CreateQuestionDto } from './dto/create-quiz.dto';
import { UpdateQuizDto, UpdateQuestionDto } from './dto/update-quiz.dto';
import { Quiz, Question } from './quiz.class';
import { CachedQuiz } from '../game/game.types';
import { QuizEntity } from '../entities/quiz.entity';
import { QuestionEntity } from '../entities/question.entity';
import { PaginatedResponse } from './dto/pagination.dto';

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(
    @InjectRepository(QuizEntity)
    private readonly quizRepository: Repository<QuizEntity>,
    @InjectRepository(QuestionEntity)
    private readonly questionRepository: Repository<QuestionEntity>,
  ) {}

  /**
   * Create a new quiz with questions
   * 
   * @param createQuizDto - The quiz data
   * @param hostId - The user ID of the quiz creator
   * @returns The created Quiz object
   */
  async createQuiz(createQuizDto: CreateQuizDto, hostId: string, hostName?: string): Promise<Quiz> {
    const quizEntity = this.quizRepository.create({
      title: createQuizDto.title,
      hostId,
      questions: createQuizDto.questions.map((qDto) =>
        this.createQuestionEntityFromDto(qDto, hostName)
      ),
    });

    if (quizEntity.questions) {
      quizEntity.questions.forEach((question) => {
        question.quiz = quizEntity;
      });
    }

    const saved = await this.quizRepository.save(quizEntity);
    return this.toDomainQuiz(saved);
  }

  /**
   * Helper to create Question from DTO
   */
  private createQuestionEntityFromDto(dto: CreateQuestionDto, defaultAuthor?: string): QuestionEntity {
    const question = this.questionRepository.create({
      text: dto.text,
      category: dto.category,
      author: dto.author || defaultAuthor,
      type: dto.type,
      timeLimitSeconds: dto.timeLimitSeconds,
      pointsMultiplier: dto.pointsMultiplier,
      options: dto.options,
      correctOptionIndex: dto.correctOptionIndex,
    });
    return question;
  }

  private toDomainQuiz(entity: QuizEntity): Quiz {
    const questions = (entity.questions || []).map(
      (q) =>
        new Question(
          q.id,
          entity.id,
          q.text,
          q.category,
          q.author,
          q.type,
          q.timeLimitSeconds,
          q.pointsMultiplier,
          q.options,
          q.correctOptionIndex
        )
    );

    return new Quiz(
      entity.id,
      entity.title,
      entity.hostId,
      questions,
      entity.createdAt,
      entity.updatedAt
    );
  }

  /**
   * Get all quizzes (returns summaries for list view) with pagination
   * 
   * Optimized to avoid loading all question entities - uses relation count instead
   * 
   * @param page - The page number (default: 1)
   * @param limit - The number of items per page (default: 10)
   * @returns Paginated quiz summaries with metadata
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<ReturnType<Quiz['getSummary']>>> {
    const skip = (page - 1) * limit;

    // Use query builder to load only quiz metadata + question count
    // This avoids loading all question entities which can be expensive
    const queryBuilder = this.quizRepository
      .createQueryBuilder('quiz')
      .loadRelationCountAndMap('quiz.questionCount', 'quiz.questions')
      .orderBy('quiz.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [quizzes, total] = await queryBuilder.getManyAndCount();

    // Map to summaries without loading full question entities
    // TypeORM adds questionCount dynamically via loadRelationCountAndMap
    type QuizWithCount = QuizEntity & { questionCount?: number };
    
    const data = quizzes.map((quiz: QuizWithCount) => ({
      id: quiz.id,
      title: quiz.title,
      hostId: quiz.hostId,
      questionCount: quiz.questionCount ?? 0,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: totalPages > 0 && page < totalPages,
        hasPreviousPage: totalPages > 0 && page > 1,
      },
    };
  }

  /**
   * Get all quizzes for a specific host
   * 
   * @param hostId - The host user ID
   * @returns Array of quiz summaries owned by the host
   */
  async findAllByHost(hostId: string): Promise<ReturnType<Quiz['getSummary']>[]> {
    const quizzes = await this.quizRepository.find({ 
      where: { hostId },
      relations: ['questions'],
    });
    return quizzes.map((quiz) => this.toDomainQuiz(quiz).getSummary());
  }

  /**
   * Get a single quiz by ID (full details including answers)
   * INTERNAL USE ONLY - contains correct answers
   * 
   * @param id - The quiz ID
   * @returns The full Quiz object
   * @throws NotFoundException if quiz doesn't exist
   */
  async findOne(id: string): Promise<Quiz> {
    const quiz = await this.quizRepository.findOne({ 
      where: { id },
      relations: ['questions'],
    });
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }
    return this.toDomainQuiz(quiz);
  }

  /**
   * Get a quiz without correct answers (safe for clients)
   * 
   * @param id - The quiz ID
   * @param requesterId - The user requesting the quiz
   * @returns Quiz with questions but without correct answers (unless requester is the host)
   */
  async findOneForClient(id: string, requesterId: string) {
    const quiz = await this.findOne(id);
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
        category: q.category,
        author: q.author,
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
  async getQuizForGame(id: string): Promise<CachedQuiz> {
    const quiz = await this.findOne(id);
    
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
  async update(id: string, updateQuizDto: UpdateQuizDto, requesterId: string): Promise<Quiz> {
    const quiz = await this.findOne(id);
    
    // Verify ownership
    if (quiz.hostId !== requesterId) {
      throw new ForbiddenException('You can only update your own quizzes');
    }

    const queryRunner = this.quizRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update title if provided
      if (updateQuizDto.title) {
        quiz.updateTitle(updateQuizDto.title);
        await queryRunner.manager.update(QuizEntity, { id: quiz.id }, { 
          title: quiz.title, 
          updatedAt: new Date() 
        });
      }

      // Update questions if provided
      if (updateQuizDto.questions) {
        await this.updateQuestions(quiz, updateQuizDto.questions, queryRunner);
      }

      await queryRunner.commitTransaction();
      
      // Refresh the quiz from database to get updated state
      return await this.findOne(id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Helper to update questions in a quiz
   * Updates only changed questions directly in the database
   */
  private async updateQuestions(quiz: Quiz, questionDtos: UpdateQuestionDto[], queryRunner: any): Promise<void> {
    for (const qDto of questionDtos) {
      if (qDto.id) {
        // Validate question exists in quiz
        const question = quiz.getQuestion(qDto.id);
        if (!question) {
          throw new NotFoundException(`Question with id "${qDto.id}" not found in quiz "${quiz.id}".`);
        }

        // Build update object with only defined fields
        const updates: Partial<QuestionEntity> = {};
        if (qDto.text !== undefined) {
          question.text = qDto.text;
          updates.text = qDto.text;
        }
        if (qDto.category !== undefined) {
          question.category = qDto.category;
          updates.category = qDto.category;
        }
        if (qDto.author !== undefined) {
          question.author = qDto.author;
          updates.author = qDto.author;
        }
        if (qDto.type !== undefined) {
          question.type = qDto.type;
          updates.type = qDto.type;
        }
        if (qDto.timeLimitSeconds !== undefined) {
          question.timeLimitSeconds = qDto.timeLimitSeconds;
          updates.timeLimitSeconds = qDto.timeLimitSeconds;
        }
        if (qDto.pointsMultiplier !== undefined) {
          question.pointsMultiplier = qDto.pointsMultiplier;
          updates.pointsMultiplier = qDto.pointsMultiplier;
        }
        if (qDto.options !== undefined) {
          question.options = qDto.options;
          updates.options = qDto.options;
        }
        if (qDto.correctOptionIndex !== undefined) {
          question.correctOptionIndex = qDto.correctOptionIndex;
          updates.correctOptionIndex = qDto.correctOptionIndex;
        }

        // Only update if there are changes
        if (Object.keys(updates).length > 0) {
          await queryRunner.manager.update(QuestionEntity, { id: qDto.id }, updates);
        }
      }
    }
    
    // Update quiz timestamp
    quiz.updatedAt = new Date();
    await queryRunner.manager.update(QuizEntity, { id: quiz.id }, { updatedAt: quiz.updatedAt });
  }

  /**
   * Add a new question to an existing quiz
   * 
   * @param quizId - The quiz ID
   * @param addQuestionDto - The question data
   * @param requesterId - The user requesting the addition
   * @returns The created Question object
   */
  async addQuestion(quizId: string, addQuestionDto: CreateQuestionDto, requesterId: string, requesterName?: string): Promise<Question> {
    const quiz = await this.findOne(quizId);
    
    if (quiz.hostId !== requesterId) {
      throw new ForbiddenException('You can only add questions to your own quizzes');
    }

    const queryRunner = this.quizRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const question = new Question(
        randomUUID(),
        quizId,
        addQuestionDto.text,
        addQuestionDto.category,
        addQuestionDto.author || requesterName,
        addQuestionDto.type,
        addQuestionDto.timeLimitSeconds,
        addQuestionDto.pointsMultiplier,
        addQuestionDto.options,
        addQuestionDto.correctOptionIndex
      );

      // Create question entity and save directly
      const questionEntity = queryRunner.manager.create(QuestionEntity, {
        id: question.id,
        text: question.text,
        category: question.category,
        author: question.author,
        type: question.type,
        timeLimitSeconds: question.timeLimitSeconds,
        pointsMultiplier: question.pointsMultiplier,
        options: question.options,
        correctOptionIndex: question.correctOptionIndex,
        quiz: { id: quizId } as QuizEntity,
      });
      
      await queryRunner.manager.save(QuestionEntity, questionEntity);
      
      // Update quiz timestamp
      await queryRunner.manager.update(QuizEntity, { id: quizId }, { updatedAt: new Date() });

      await queryRunner.commitTransaction();
      
      quiz.addQuestion(question);
      return question;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Add a new question to an existing quiz for a game player
   * This bypasses ownership checks as it's for game contributions
   * 
   * @param quizId - The quiz ID
   * @param addQuestionDto - The question data
   * @param contributorId - The user ID of the player contributing
   * @returns The created Question object
   */
  async addQuestionForGamePlayer(quizId: string, addQuestionDto: CreateQuestionDto, contributorId: string, contributorName?: string): Promise<Question> {
    const quiz = await this.findOne(quizId);
    
    const queryRunner = this.quizRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const question = new Question(
        randomUUID(),
        quizId,
        addQuestionDto.text,
        addQuestionDto.category,
        addQuestionDto.author || contributorName,
        addQuestionDto.type,
        addQuestionDto.timeLimitSeconds,
        addQuestionDto.pointsMultiplier,
        addQuestionDto.options,
        addQuestionDto.correctOptionIndex
      );

      // Create question entity and save directly
      const questionEntity = queryRunner.manager.create(QuestionEntity, {
        id: question.id,
        text: question.text,
        category: question.category,
        author: question.author,
        type: question.type,
        timeLimitSeconds: question.timeLimitSeconds,
        pointsMultiplier: question.pointsMultiplier,
        options: question.options,
        correctOptionIndex: question.correctOptionIndex,
        quiz: { id: quizId } as QuizEntity,
      });
      
      await queryRunner.manager.save(QuestionEntity, questionEntity);
      
      // Update quiz timestamp
      await queryRunner.manager.update(QuizEntity, { id: quizId }, { updatedAt: new Date() });

      await queryRunner.commitTransaction();
      
      quiz.addQuestion(question);
      this.logger.log(`Player ${contributorId} contributed a question to quiz ${quizId}`);
      
      return question;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Remove a question from a quiz
   * 
   * @param quizId - The quiz ID
   * @param questionId - The question ID to remove
   * @param requesterId - The user requesting the removal
   * @returns True if removed, false if question not found
   */
  async removeQuestion(quizId: string, questionId: string, requesterId: string): Promise<boolean> {
    const quiz = await this.findOne(quizId);
    
    if (quiz.hostId !== requesterId) {
      throw new ForbiddenException('You can only modify your own quizzes');
    }

    const removed = quiz.removeQuestion(questionId);
    if (removed) {
      await this.questionRepository.delete({ id: questionId });
      await this.quizRepository.update({ id: quizId }, { updatedAt: new Date() });
    }
    return removed;
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
  async remove(id: string, requesterId: string): Promise<Quiz> {
    const quiz = await this.findOne(id);
    
    if (quiz.hostId !== requesterId) {
      throw new ForbiddenException('You can only delete your own quizzes');
    }

    await this.quizRepository.delete({ id });
    return quiz;
  }

  /**
   * Check if a quiz exists
   * 
   * @param id - The quiz ID
   * @returns True if quiz exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.quizRepository.count({ where: { id } });
    return count > 0;
  }

  /**
   * Validate that a quiz is ready to be played
   * 
   * @param id - The quiz ID
   * @returns Validation result with reason if invalid
   */
  async validateForGame(id: string): Promise<{ valid: boolean; reason?: string }> {
    const quiz = await this.findOne(id);
    return quiz.isPlayable();
  }

  /**
   * Get quiz statistics
   * 
   * @returns Stats about stored quizzes
   */
  async getStats() {
    const totalQuizzes = await this.quizRepository.count();
    const totalQuestions = await this.questionRepository.count();
    
    return {
      totalQuizzes,
      totalQuestions,
      averageQuestionsPerQuiz: totalQuizzes > 0 
        ? Math.round(totalQuestions / totalQuizzes * 10) / 10 
        : 0,
    };
  }

}
