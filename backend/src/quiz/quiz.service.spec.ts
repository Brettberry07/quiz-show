import { Test, TestingModule } from '@nestjs/testing';
import { QuizService } from './quiz.service';
import { Repository, QueryRunner } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QuizEntity } from '../entities/quiz.entity';
import { QuestionEntity } from '../entities/question.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { QuestionType } from '../game/game.types';

describe('QuizService', () => {
  let service: QuizService;
  let quizRepository: Repository<QuizEntity>;
  let questionRepository: Repository<QuestionEntity>;
  let mockQueryRunner: Partial<QueryRunner>;

  const mockQuizEntity: QuizEntity = {
    id: 'quiz-123',
    title: 'Test Quiz',
    hostId: 'user-123',
    questions: [
      {
        id: 'q1',
        text: 'Question 1?',
        category: 'General',
        author: 'Test Author',
        type: QuestionType.MULTIPLE_CHOICE,
        timeLimitSeconds: 30,
        pointsMultiplier: 1,
        options: ['A', 'B', 'C', 'D'],
        correctOptionIndex: 0,
        quiz: null,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    // Create mock QueryRunner
    mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        create: jest.fn((entity, data) => data),
        save: jest.fn((entity, data) => Promise.resolve(data)),
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizService,
        {
          provide: getRepositoryToken(QuizEntity),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
            manager: {
              connection: {
                createQueryRunner: jest.fn(() => mockQueryRunner),
              },
            },
          },
        },
        {
          provide: getRepositoryToken(QuestionEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QuizService>(QuizService);
    quizRepository = module.get<Repository<QuizEntity>>(getRepositoryToken(QuizEntity));
    questionRepository = module.get<Repository<QuestionEntity>>(getRepositoryToken(QuestionEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addQuestion (optimized)', () => {
    it('should add a question using transaction without loading all questions', async () => {
      const quizId = 'quiz-123';
      const requesterId = 'user-123';
      const addQuestionDto = {
        text: 'New Question?',
        type: QuestionType.MULTIPLE_CHOICE,
        timeLimitSeconds: 30,
        pointsMultiplier: 1,
        options: ['A', 'B', 'C'],
        correctOptionIndex: 1,
      };

      jest.spyOn(quizRepository, 'findOne').mockResolvedValue(mockQuizEntity);

      const result = await service.addQuestion(quizId, addQuestionDto, requesterId, 'Test User');

      // Verify transaction was used
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();

      // Verify question entity was created directly
      expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
        QuestionEntity,
        expect.objectContaining({
          text: 'New Question?',
          type: QuestionType.MULTIPLE_CHOICE,
          options: ['A', 'B', 'C'],
          correctOptionIndex: 1,
        })
      );

      // Verify question was saved
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        QuestionEntity,
        expect.any(Object)
      );

      // Verify quiz timestamp was updated
      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(
        QuizEntity,
        { id: quizId },
        { updatedAt: expect.any(Date) }
      );

      expect(result.text).toBe('New Question?');
    });

    it('should rollback transaction on error', async () => {
      const quizId = 'quiz-123';
      const requesterId = 'user-123';
      const addQuestionDto = {
        text: 'New Question?',
        type: QuestionType.MULTIPLE_CHOICE,
        timeLimitSeconds: 30,
        pointsMultiplier: 1,
        options: ['A', 'B'],
        correctOptionIndex: 0,
      };

      jest.spyOn(quizRepository, 'findOne').mockResolvedValue(mockQuizEntity);
      mockQueryRunner.manager.save = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        service.addQuestion(quizId, addQuestionDto, requesterId)
      ).rejects.toThrow('Database error');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if requester is not the host', async () => {
      const quizId = 'quiz-123';
      const requesterId = 'user-999'; // Different user
      const addQuestionDto = {
        text: 'New Question?',
        type: QuestionType.MULTIPLE_CHOICE,
        timeLimitSeconds: 30,
        pointsMultiplier: 1,
        options: ['A', 'B'],
        correctOptionIndex: 0,
      };

      jest.spyOn(quizRepository, 'findOne').mockResolvedValue(mockQuizEntity);

      await expect(
        service.addQuestion(quizId, addQuestionDto, requesterId)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('addQuestionForGamePlayer (optimized)', () => {
    it('should add a question for game player without ownership check', async () => {
      const quizId = 'quiz-123';
      const contributorId = 'player-999';
      const addQuestionDto = {
        text: 'Player Question?',
        type: QuestionType.MULTIPLE_CHOICE,
        timeLimitSeconds: 30,
        pointsMultiplier: 1,
        options: ['A', 'B', 'C'],
        correctOptionIndex: 2,
      };

      jest.spyOn(quizRepository, 'findOne').mockResolvedValue(mockQuizEntity);

      const result = await service.addQuestionForGamePlayer(
        quizId,
        addQuestionDto,
        contributorId,
        'Player Name'
      );

      // Verify transaction was used
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();

      // Verify question was created and saved
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        QuestionEntity,
        expect.any(Object)
      );

      expect(result.text).toBe('Player Question?');
    });
  });

  describe('update (optimized)', () => {
    it('should update only quiz title without touching questions', async () => {
      const quizId = 'quiz-123';
      const requesterId = 'user-123';
      const updateDto = {
        title: 'Updated Title',
      };

      jest.spyOn(quizRepository, 'findOne').mockResolvedValue(mockQuizEntity);

      const result = await service.update(quizId, updateDto, requesterId);

      // Verify transaction was used
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();

      // Verify only quiz entity was updated
      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(
        QuizEntity,
        { id: quizId },
        expect.objectContaining({
          title: 'Updated Title',
          updatedAt: expect.any(Date),
        })
      );

      // Verify questions were NOT touched
      expect(mockQueryRunner.manager.save).not.toHaveBeenCalledWith(
        QuestionEntity,
        expect.any(Object)
      );
    });

    it('should update only specified question fields', async () => {
      const quizId = 'quiz-123';
      const requesterId = 'user-123';
      const updateDto = {
        questions: [
          {
            id: 'q1',
            text: 'Updated Question Text',
            timeLimitSeconds: 45,
          },
        ],
      };

      jest.spyOn(quizRepository, 'findOne').mockResolvedValue(mockQuizEntity);

      await service.update(quizId, updateDto, requesterId);

      // Verify only the specified fields were updated
      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(
        QuestionEntity,
        { id: 'q1' },
        {
          text: 'Updated Question Text',
          timeLimitSeconds: 45,
        }
      );

      // Verify quiz timestamp was updated
      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(
        QuizEntity,
        { id: quizId },
        { updatedAt: expect.any(Date) }
      );
    });

    it('should update both title and questions in same transaction', async () => {
      const quizId = 'quiz-123';
      const requesterId = 'user-123';
      const updateDto = {
        title: 'New Title',
        questions: [
          {
            id: 'q1',
            text: 'Updated Question',
          },
        ],
      };

      jest.spyOn(quizRepository, 'findOne').mockResolvedValue(mockQuizEntity);

      await service.update(quizId, updateDto, requesterId);

      // Verify both updates happened
      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(
        QuizEntity,
        { id: quizId },
        expect.objectContaining({
          title: 'New Title',
        })
      );

      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(
        QuestionEntity,
        { id: 'q1' },
        { text: 'Updated Question' }
      );

      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent question', async () => {
      const quizId = 'quiz-123';
      const requesterId = 'user-123';
      const updateDto = {
        questions: [
          {
            id: 'non-existent-question',
            text: 'Updated Text',
          },
        ],
      };

      jest.spyOn(quizRepository, 'findOne').mockResolvedValue(mockQuizEntity);

      await expect(
        service.update(quizId, updateDto, requesterId)
      ).rejects.toThrow(NotFoundException);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if requester is not the host', async () => {
      const quizId = 'quiz-123';
      const requesterId = 'user-999'; // Different user
      const updateDto = {
        title: 'Hacked Title',
      };

      jest.spyOn(quizRepository, 'findOne').mockResolvedValue(mockQuizEntity);

      await expect(
        service.update(quizId, updateDto, requesterId)
      ).rejects.toThrow(ForbiddenException);

      // Transaction should not have been started
      expect(mockQueryRunner.startTransaction).not.toHaveBeenCalled();
    });

    it('should rollback on error during update', async () => {
      const quizId = 'quiz-123';
      const requesterId = 'user-123';
      const updateDto = {
        title: 'New Title',
      };

      jest.spyOn(quizRepository, 'findOne').mockResolvedValue(mockQuizEntity);
      mockQueryRunner.manager.update = jest.fn().mockRejectedValue(new Error('Update failed'));

      await expect(
        service.update(quizId, updateDto, requesterId)
      ).rejects.toThrow('Update failed');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('removeQuestion', () => {
    it('should remove question using questionRepository directly', async () => {
      const quizId = 'quiz-123';
      const questionId = 'q1';
      const requesterId = 'user-123';

      jest.spyOn(quizRepository, 'findOne').mockResolvedValue(mockQuizEntity);
      jest.spyOn(questionRepository, 'delete').mockResolvedValue({ affected: 1, raw: {} });
      jest.spyOn(quizRepository, 'update').mockResolvedValue({ affected: 1, generatedMaps: [], raw: {} });

      const result = await service.removeQuestion(quizId, questionId, requesterId);

      expect(result).toBe(true);
      expect(questionRepository.delete).toHaveBeenCalledWith({ id: questionId });
      expect(quizRepository.update).toHaveBeenCalledWith(
        { id: quizId },
        { updatedAt: expect.any(Date) }
      );
    });

    it('should throw ForbiddenException if requester is not the host', async () => {
      const quizId = 'quiz-123';
      const questionId = 'q1';
      const requesterId = 'user-999';

      jest.spyOn(quizRepository, 'findOne').mockResolvedValue(mockQuizEntity);

      await expect(
        service.removeQuestion(quizId, questionId, requesterId)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Performance Validation', () => {
    it('should not load all questions when updating quiz title', async () => {
      const quizId = 'quiz-123';
      const requesterId = 'user-123';
      const updateDto = { title: 'New Title' };

      // Create a quiz with many questions
      const largeQuizEntity = {
        ...mockQuizEntity,
        questions: Array.from({ length: 100 }, (_, i) => ({
          id: `q${i}`,
          text: `Question ${i}`,
          category: 'General',
          author: 'Test',
          type: QuestionType.MULTIPLE_CHOICE,
          timeLimitSeconds: 30,
          pointsMultiplier: 1,
          options: ['A', 'B', 'C'],
          correctOptionIndex: 0,
          quiz: null,
        })),
      };

      jest.spyOn(quizRepository, 'findOne').mockResolvedValue(largeQuizEntity as any);

      await service.update(quizId, updateDto, requesterId);

      // Verify we only called update on QuizEntity, not on individual questions
      const quizUpdates = (mockQueryRunner.manager.update as jest.Mock).mock.calls.filter(
        call => call[0] === QuizEntity
      );
      const questionUpdates = (mockQueryRunner.manager.update as jest.Mock).mock.calls.filter(
        call => call[0] === QuestionEntity
      );

      expect(quizUpdates.length).toBe(1); // Only one quiz update
      expect(questionUpdates.length).toBe(0); // No question updates
      expect(mockQueryRunner.manager.save).not.toHaveBeenCalled(); // No bulk saves
    });

    it('should update only changed questions, not all questions', async () => {
      const quizId = 'quiz-123';
      const requesterId = 'user-123';
      
      // Quiz has 3 questions, but we only update 1
      const quizWith3Questions = {
        ...mockQuizEntity,
        questions: [
          { id: 'q1', text: 'Q1', category: 'Cat1', author: 'A', type: QuestionType.MULTIPLE_CHOICE, timeLimitSeconds: 30, pointsMultiplier: 1, options: ['A', 'B'], correctOptionIndex: 0, quiz: null },
          { id: 'q2', text: 'Q2', category: 'Cat2', author: 'A', type: QuestionType.MULTIPLE_CHOICE, timeLimitSeconds: 30, pointsMultiplier: 1, options: ['A', 'B'], correctOptionIndex: 0, quiz: null },
          { id: 'q3', text: 'Q3', category: 'Cat3', author: 'A', type: QuestionType.MULTIPLE_CHOICE, timeLimitSeconds: 30, pointsMultiplier: 1, options: ['A', 'B'], correctOptionIndex: 0, quiz: null },
        ],
      };

      const updateDto = {
        questions: [
          { id: 'q2', text: 'Updated Q2' }, // Only updating q2
        ],
      };

      jest.spyOn(quizRepository, 'findOne').mockResolvedValue(quizWith3Questions as any);

      await service.update(quizId, updateDto, requesterId);

      // Verify only 1 question was updated, not all 3
      const questionUpdates = (mockQueryRunner.manager.update as jest.Mock).mock.calls.filter(
        call => call[0] === QuestionEntity
      );

      expect(questionUpdates.length).toBe(1);
      expect(questionUpdates[0][1]).toEqual({ id: 'q2' });
      expect(questionUpdates[0][2]).toEqual({ text: 'Updated Q2' });
    });
  });
});
