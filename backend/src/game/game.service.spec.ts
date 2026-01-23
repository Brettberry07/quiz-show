import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { GameEventsService } from './game-events.service';
import { QuizService } from '../quiz/quiz.service';
import { CachedQuiz, QuestionType } from './game.types';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('GameService', () => {
    let service: GameService;
    let mockGameEventsService: Partial<GameEventsService>;
    let mockQuizService: Partial<QuizService>;
    
    const mockQuiz: CachedQuiz = {
        id: 'quiz-1',
        title: 'Test Quiz',
        hostId: 'host-1',
        questions: [
            {
                id: 'q1',
                text: 'Question 1',
                type: QuestionType.MULTIPLE_CHOICE,
                timeLimitSeconds: 10,
                pointsMultiplier: 1,
                options: ['A', 'B', 'C', 'D'],
                correctOptionIndex: 0,
            },
        ],
    };
    
    beforeEach(async () => {
        mockGameEventsService = {
            emitToPin: jest.fn(),
            setServer: jest.fn(),
        };

        mockQuizService = {
            getQuizForGame: jest.fn().mockResolvedValue(mockQuiz),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameService,
                { provide: GameEventsService, useValue: mockGameEventsService },
                { provide: QuizService, useValue: mockQuizService },
            ],
        }).compile();
        
        service = module.get<GameService>(GameService);
    });
    
    describe('createGame', () => {
        it('should create a game and return summary', () => {
            const result = service.createGame(mockQuiz, {
                hostUserId: 'host-1', hostSocketId: 'socket-1',
                quizId: ''
            });
            
            expect(result.pin).toHaveLength(6);
            expect(result.quizTitle).toBe(mockQuiz.title);
            expect(service.getGame(result.pin)).toBeDefined();
        });
    });
    
    describe('getGame', () => {
        it('should retrieve existing game', () => {
            const { pin } = service.createGame(mockQuiz, {
                hostUserId: 'host-1', hostSocketId: 'socket-1',
                quizId: ''
            });
            const game = service.getGame(pin);
            expect(game).toBeDefined();
            expect(game.pin).toBe(pin);
        });
        
        it('should throw NotFoundException for non-existent PIN', () => {
            expect(() => service.getGame('000000')).toThrow(NotFoundException);
        });
        
        it('should throw BadRequestException for invalid PIN format', () => {
            expect(() => service.getGame('123')).toThrow(BadRequestException);
        });
    });
    
    describe('addPlayer', () => {
        it('should add player to game and update map', () => {
            const { pin } = service.createGame(mockQuiz, {
                hostUserId: 'host-1', hostSocketId: 'socket-1',
                quizId: ''
            });
            
            const result = service.addPlayer({
                pin,
                userId: 'user-1',
                nickname: 'Player 1',
                socketId: 'socket-u1'
            });
            
            expect(result.playerId).toBe('user-1');
            expect(service.getPlayers(pin)).toHaveLength(1);
        });
        
        it('should throw if game not found', () => {
            expect(() => service.addPlayer({
                pin: '999999',
                userId: 'user-1',
                nickname: 'Player 1',
                socketId: 'socket-u1'
            })).toThrow(NotFoundException);
        });
    });
    
    describe('removePlayer', () => {
        it('should remove player from game and map', () => {
            const { pin } = service.createGame(mockQuiz, {
                hostUserId: 'host-1', hostSocketId: 'socket-1',
                quizId: ''
            });
            service.addPlayer({ pin, userId: 'user-1', nickname: 'P1', socketId: 's1' });
            
            service.removePlayer(pin, 'user-1');
            expect(service.getPlayers(pin)).toHaveLength(0);
        });
    });
    
    describe('deleteGame', () => {
        it('should remove game and cleanup', () => {
            const { pin } = service.createGame(mockQuiz, {
                hostUserId: 'host-1', hostSocketId: 'socket-1',
                quizId: ''
            });
            service.addPlayer({ pin, userId: 'user-1', nickname: 'P1', socketId: 's1' });
            
            service.deleteGame(pin);
            
            expect(() => service.getGame(pin)).toThrow(NotFoundException);
            // We can't easily check private map cleanup without spying internal maps, 
            // but can verify game is gone via public API.
        });
    });
});
