import { Test, TestingModule } from '@nestjs/testing';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HttpStatus } from '@nestjs/common';
import { QuestionType } from '../game/game.types';

describe('QuizController', () => {
  let controller: QuizController;
  let service: QuizService;

  // Mock JwtAuthGuard to always allow access in tests
  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizController],
      providers: [QuizService],
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
    it('should create a quiz', () => {
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

      const result = controller.createQuiz(createQuizDto, mockRequest);

      expect(result.message).toBe('Quiz created successfully');
      expect(result.status).toBe(HttpStatus.CREATED);
      expect(result.data.title).toBe('Test Quiz');
    });
  });

  describe('findAll', () => {
    it('should return empty array initially', () => {
      const result = controller.findAll();
      expect(result.data).toEqual([]);
    });
  });

  describe('findMyQuizzes', () => {
    it('should return quizzes owned by the user', () => {
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
      controller.createQuiz(createQuizDto, mockRequest);

      const result = controller.findMyQuizzes(mockRequest);
      expect(result.data.length).toBe(1);
      expect(result.data[0].title).toBe('My Quiz');
    });
  });
});
