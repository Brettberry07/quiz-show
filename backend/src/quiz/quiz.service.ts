import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { CreateQuizDto, CreateQuestionDto } from './dto/create-quiz.dto';
import { UpdateQuizDto, UpdateQuestionDto } from './dto/update-quiz.dto';
import { Quiz, Question } from './quiz.class';
import { CachedQuiz } from '../game/game.types';
import { PaginatedResponse } from './dto/pagination.dto';

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly db: Database.Database,
  ) {}

  private extractQuiz(quizRow: any, questionRows: any[]): Quiz {
    const questions = questionRows.map(q => new Question(
        q.id,
        q.quizId,
        q.text,
        q.category,
        q.author,
        q.type,
        q.timeLimitSeconds,
        q.pointsMultiplier,
        JSON.parse(q.options),
        q.correctOptionIndex
    ));
    return new Quiz(
        quizRow.id,
        quizRow.title,
        quizRow.hostId,
        questions,
        new Date(quizRow.createdAt),
        new Date(quizRow.updatedAt)
    );
  }

  async createQuiz(createQuizDto: CreateQuizDto, hostId: string, hostName?: string): Promise<Quiz> {
    const quizId = randomUUID();
    const now = new Date().toISOString();
    
    // Start transaction
    const transaction = this.db.transaction(() => {
      this.db.prepare('INSERT INTO quizzes (id, title, hostId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)').run(
          quizId, createQuizDto.title, hostId, now, now
      );
      
      const insertQuestion = this.db.prepare('INSERT INTO questions (id, quizId, text, category, author, type, timeLimitSeconds, pointsMultiplier, options, correctOptionIndex) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      
      for (const qDto of createQuizDto.questions) {
        insertQuestion.run(
          randomUUID(),
          quizId,
          qDto.text,
          qDto.category || null,
          qDto.author || hostName || null,
          qDto.type,
          qDto.timeLimitSeconds,
          qDto.pointsMultiplier,
          JSON.stringify(qDto.options),
          qDto.correctOptionIndex
        );
      }
    });
    
    transaction();
    
    return this.findOne(quizId);
  }

  async findAll(page: number = 1, limit: number = 10): Promise<PaginatedResponse<ReturnType<Quiz['getSummary']>>> {
    const skip = (page - 1) * limit;
    
    const countRow = this.db.prepare('SELECT COUNT(*) as cnt FROM quizzes').get() as { cnt: number };
    const total = countRow.cnt;
    
    const quizzesRows = this.db.prepare(`
      SELECT q.*, (SELECT COUNT(*) FROM questions qt WHERE qt.quizId = q.id) as questionCount
      FROM quizzes q
      ORDER BY q.createdAt DESC
      LIMIT ? OFFSET ?
    `).all(limit, skip) as Array<{id: string, title: string, hostId: string, createdAt: string, updatedAt: string, questionCount: number}>;

    const data = quizzesRows.map(row => ({
      id: row.id,
      title: row.title,
      hostId: row.hostId,
      questionCount: row.questionCount,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
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

  async findAllByHost(hostId: string): Promise<ReturnType<Quiz['getSummary']>[]> {
    const quizzesRows = this.db.prepare(`
      SELECT q.*, (SELECT COUNT(*) FROM questions qt WHERE qt.quizId = q.id) as questionCount
      FROM quizzes q
      WHERE q.hostId = ?
    `).all(hostId) as Array<{id: string, title: string, hostId: string, createdAt: string, updatedAt: string, questionCount: number}>;
    
    return quizzesRows.map(row => ({
      id: row.id,
      title: row.title,
      hostId: row.hostId,
      questionCount: row.questionCount,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  }

  async findOne(id: string): Promise<Quiz> {
    const quizRow = this.db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id) as any;
    if (!quizRow) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }
    const questionRows = this.db.prepare('SELECT * FROM questions WHERE quizId = ?').all(id) as any[];
    return this.extractQuiz(quizRow, questionRows);
  }

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
        ...(isHost && { correctOptionIndex: q.correctOptionIndex }),
      })),
    };
  }

  async getQuizForGame(id: string): Promise<CachedQuiz> {
    const quiz = await this.findOne(id);
    
    const playability = quiz.isPlayable();
    if (!playability.valid) {
      throw new BadRequestException(playability.reason);
    }

    return quiz.toCachedQuiz();
  }

  async update(id: string, updateQuizDto: UpdateQuizDto, requesterId: string): Promise<Quiz> {
    const quiz = await this.findOne(id);
    
    if (quiz.hostId !== requesterId) {
      throw new ForbiddenException('You can only update your own quizzes');
    }

    const transaction = this.db.transaction(() => {
      const now = new Date().toISOString();
      if (updateQuizDto.title) {
        this.db.prepare('UPDATE quizzes SET title = ?, updatedAt = ? WHERE id = ?').run(updateQuizDto.title, now, id);
      }
      
      if (updateQuizDto.questions) {
        const updateQuestion = this.db.prepare(`
          UPDATE questions 
          SET text = COALESCE(?, text), category = COALESCE(?, category), author = COALESCE(?, author), type = COALESCE(?, type),
              timeLimitSeconds = COALESCE(?, timeLimitSeconds), pointsMultiplier = COALESCE(?, pointsMultiplier),
              options = COALESCE(?, options), correctOptionIndex = COALESCE(?, correctOptionIndex)
          WHERE id = ? AND quizId = ?
        `);
        for (const qDto of updateQuizDto.questions) {
            if (qDto.id) {
                const question = quiz.getQuestion(qDto.id);
                if (!question) {
                  throw new NotFoundException(`Question with id "${qDto.id}" not found in quiz "${quiz.id}".`);
                }
                const optionsStr = qDto.options ? JSON.stringify(qDto.options) : null;
                updateQuestion.run(
                   qDto.text ?? null,
                   qDto.category ?? null,
                   qDto.author ?? null,
                   qDto.type ?? null,
                   qDto.timeLimitSeconds ?? null,
                   qDto.pointsMultiplier ?? null,
                   optionsStr,
                   qDto.correctOptionIndex ?? null,
                   qDto.id,
                   id
                );
            }
        }
        this.db.prepare('UPDATE quizzes SET updatedAt = ? WHERE id = ?').run(now, id);
      }
    });

    transaction();
    return await this.findOne(id);
  }

  async addQuestion(quizId: string, addQuestionDto: CreateQuestionDto, requesterId: string, requesterName?: string): Promise<Question> {
    const quiz = await this.findOne(quizId);
    
    if (quiz.hostId !== requesterId) {
      throw new ForbiddenException('You can only add questions to your own quizzes');
    }

    const questionId = randomUUID();
    const now = new Date().toISOString();

    const transaction = this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO questions (id, quizId, text, category, author, type, timeLimitSeconds, pointsMultiplier, options, correctOptionIndex)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        questionId,
        quizId,
        addQuestionDto.text,
        addQuestionDto.category || null,
        addQuestionDto.author || requesterName || null,
        addQuestionDto.type,
        addQuestionDto.timeLimitSeconds,
        addQuestionDto.pointsMultiplier,
        JSON.stringify(addQuestionDto.options),
        addQuestionDto.correctOptionIndex
      );
      this.db.prepare('UPDATE quizzes SET updatedAt = ? WHERE id = ?').run(now, quizId);
    });

    transaction();

    // just fetch the updated quiz from db to return the exact question
    const updatedQuiz = await this.findOne(quizId);
    return updatedQuiz.getQuestion(questionId) as Question;
  }

  async addQuestionForGamePlayer(quizId: string, addQuestionDto: CreateQuestionDto, contributorId: string, contributorName?: string): Promise<Question> {
    const quiz = await this.findOne(quizId);
    const questionId = randomUUID();
    const now = new Date().toISOString();

    const transaction = this.db.transaction(() => {
        this.db.prepare(`
          INSERT INTO questions (id, quizId, text, category, author, type, timeLimitSeconds, pointsMultiplier, options, correctOptionIndex)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          questionId,
          quizId,
          addQuestionDto.text,
          addQuestionDto.category || null,
          addQuestionDto.author || contributorName || null,
          addQuestionDto.type,
          addQuestionDto.timeLimitSeconds,
          addQuestionDto.pointsMultiplier,
          JSON.stringify(addQuestionDto.options),
          addQuestionDto.correctOptionIndex
        );
        this.db.prepare('UPDATE quizzes SET updatedAt = ? WHERE id = ?').run(now, quizId);
    });
    
    transaction();
    this.logger.log(`Player ${contributorId} contributed a question to quiz ${quizId}`);
    
    const updatedQuiz = await this.findOne(quizId);
    return updatedQuiz.getQuestion(questionId) as Question;
  }

  async removeQuestion(quizId: string, questionId: string, requesterId: string): Promise<boolean> {
    const quiz = await this.findOne(quizId);
    
    if (quiz.hostId !== requesterId) {
      throw new ForbiddenException('You can only modify your own quizzes');
    }

    const result = this.db.prepare('DELETE FROM questions WHERE id = ? AND quizId = ?').run(questionId, quizId);
    if (result.changes > 0) {
        this.db.prepare('UPDATE quizzes SET updatedAt = ? WHERE id = ?').run(new Date().toISOString(), quizId);
        return true;
    }
    return false;
  }

  async remove(id: string, requesterId: string): Promise<Quiz> {
    const quiz = await this.findOne(id);
    
    if (quiz.hostId !== requesterId) {
      throw new ForbiddenException('You can only delete your own quizzes');
    }

    this.db.prepare('DELETE FROM quizzes WHERE id = ?').run(id);
    return quiz;
  }

  async exists(id: string): Promise<boolean> {
    const countRow = this.db.prepare('SELECT COUNT(*) as count FROM quizzes WHERE id = ?').get(id) as { count: number };
    return countRow.count > 0;
  }

  async validateForGame(id: string): Promise<{ valid: boolean; reason?: string }> {
    const quiz = await this.findOne(id);
    return quiz.isPlayable();
  }

  async getStats() {
    const totalQuizzes = (this.db.prepare('SELECT COUNT(*) as c FROM quizzes').get() as {c: number}).c;
    const totalQuestions = (this.db.prepare('SELECT COUNT(*) as c FROM questions').get() as {c: number}).c;
    
    return {
      totalQuizzes,
      totalQuestions,
      averageQuestionsPerQuiz: totalQuizzes > 0 
        ? Math.round(totalQuestions / totalQuizzes * 10) / 10 
        : 0,
    };
  }
}
