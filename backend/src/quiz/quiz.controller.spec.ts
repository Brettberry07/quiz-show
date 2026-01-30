import { Test, TestingModule } from '@nestjs/testing';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { QuestionType } from '../game/game.types';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizEntity } from '../entities/quiz.entity';
import { QuestionEntity } from '../entities/question.entity';
import { GameService } from '../game/game.service';

describe('QuizController', () => {
  let controller: QuizController;
  let service: QuizService;

  // Mock JwtAuthGuard to always allow access in tests
  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [QuizEntity, QuestionEntity],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([QuizEntity, QuestionEntity]),
      ],
      controllers: [QuizController],
      providers: [
        QuizService,
        {
          provide: GameService,
          useValue: { validatePlayerQuestionContribution: jest.fn() },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<QuizController>(QuizController);
    service = module.get<QuizService>(QuizService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have quiz service defined', () => {
    expect(service).toBeDefined();
  });

  describe('createQuiz', () => {
    it('should create a quiz', async () => {
      const createQuizDto = {
        title: 'Test Quiz',
        questions: [
          {
            text: 'What is 2 + 2?',
            type: QuestionType.MULTIPLE_CHOICE,
            timeLimitSeconds: 30,
            pointsMultiplier: 1,
            options: ['3', '4', '5', '6'],
            correctOptionIndex: 1,
          },
        ],
      };
      const mockRequest = { user: { id: 'user-123', username: 'testuser', role: 'user' } };

      const result = await controller.createQuiz(createQuizDto, mockRequest);

      expect(result.message).toBe('Quiz created successfully');
      expect(result.data.title).toBe('Test Quiz');
    });
  });

  describe('findAll', () => {
    it('should return empty paginated result initially', async () => {
      const paginationDto = { page: 1, limit: 10 };
      const result = await controller.findAll(paginationDto);
      expect(result.data).toEqual([]);
      expect(result.meta).toEqual({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('should return paginated quizzes with default pagination', async () => {
      const mockRequest = { user: { id: 'user-123', username: 'testuser', role: 'user' } };
      
      // Create multiple quizzes
      for (let i = 0; i < 3; i++) {
        await controller.createQuiz({
          title: `Quiz ${i + 1}`,
          questions: [{
            text: 'Question?',
            type: QuestionType.MULTIPLE_CHOICE,
            timeLimitSeconds: 30,
            pointsMultiplier: 1,
            options: ['A', 'B'],
            correctOptionIndex: 0,
          }],
        }, mockRequest);
      }

      const paginationDto = { page: 1, limit: 10 };
      const result = await controller.findAll(paginationDto);
      
      expect(result.data.length).toBe(3);
      expect(result.meta.total).toBe(3);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPreviousPage).toBe(false);
    });

    it('should respect pagination limits', async () => {
      const mockRequest = { user: { id: 'user-123', username: 'testuser', role: 'user' } };
      
      // Create 5 quizzes
      for (let i = 0; i < 5; i++) {
        await controller.createQuiz({
          title: `Quiz ${i + 1}`,
          questions: [{
            text: 'Question?',
            type: QuestionType.MULTIPLE_CHOICE,
            timeLimitSeconds: 30,
            pointsMultiplier: 1,
            options: ['A', 'B'],
            correctOptionIndex: 0,
          }],
        }, mockRequest);
      }

      // Request page 1 with limit 2
      const page1 = await controller.findAll({ page: 1, limit: 2 });
      expect(page1.data.length).toBe(2);
      expect(page1.meta.hasNextPage).toBe(true);
      expect(page1.meta.hasPreviousPage).toBe(false);

      // Request page 2 with limit 2
      const page2 = await controller.findAll({ page: 2, limit: 2 });
      expect(page2.data.length).toBe(2);
      expect(page2.meta.hasNextPage).toBe(true);
      expect(page2.meta.hasPreviousPage).toBe(true);

      // Request page 3 with limit 2
      const page3 = await controller.findAll({ page: 3, limit: 2 });
      expect(page3.data.length).toBe(1);
      expect(page3.meta.hasNextPage).toBe(false);
      expect(page3.meta.hasPreviousPage).toBe(true);
    });
  });

  describe('findMyQuizzes', () => {
    it('should return quizzes owned by the user', async () => {
      const mockRequest = { user: { id: 'user-123', username: 'testuser', role: 'user' } };
      
      // Create a quiz first
      const createQuizDto = {
        title: 'My Quiz',
        questions: [
          {
            text: 'Question?',
            type: QuestionType.MULTIPLE_CHOICE,
            timeLimitSeconds: 30,
            pointsMultiplier: 1,
            options: ['A', 'B'],
            correctOptionIndex: 0,
          },
        ],
      };
      await controller.createQuiz(createQuizDto, mockRequest);

      const result = await controller.findMyQuizzes(mockRequest);
      expect(result.data.length).toBe(1);
      expect(result.data[0].title).toBe('My Quiz');
    });
  });
});
