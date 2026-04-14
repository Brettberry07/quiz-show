import { Test, TestingModule } from '@nestjs/testing';
import { QuizService } from './quiz.service';

describe('QuizService', () => {
  let service: QuizService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizService,
        {
          provide: 'DATABASE_CONNECTION',
          useValue: {
            prepare: jest.fn().mockReturnValue({ run: jest.fn(), get: jest.fn(), all: jest.fn() }),
            transaction: jest.fn((cb) => cb),
          },
        },
      ],
    }).compile();

    service = module.get<QuizService>(QuizService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
