import { BadRequestException } from '@nestjs/common';
import { Game } from './game.class';
import { CachedQuiz, GameState, QuestionType, ScoreConfig } from './game.types';

describe('Game Class', () => {
  let game: Game;
  const mockScoreConfig: ScoreConfig = {
    basePoints: 1000,
    minimumPointsRatio: 0.5,
    comboBonus: 0.1,
    maxComboMultiplier: 1.5,
    graceWindowMs: 500,
  };

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
      {
        id: 'q2',
        text: 'Question 2',
        type: QuestionType.TRUE_FALSE,
        timeLimitSeconds: 5,
        pointsMultiplier: 2,
        options: ['True', 'False'],
        correctOptionIndex: 1,
      },
    ],
  };

  beforeEach(() => {
    game = new Game('123456', mockQuiz, 'host-1', 'host-socket-1', mockScoreConfig);
    // Mock hrtime to return consistent values if needed, 
    // but for now relying on actual time or mocked timeouts might be tricky.
    // For unit tests checking logic, usually enough.
  });

  afterEach(() => {
    game.destroy();
  });

  describe('initialization', () => {
    it('should initialize with correct default values', () => {
      expect(game.pin).toBe('123456');
      expect(game.state).toBe(GameState.LOBBY);
      expect(game.getPlayerCount()).toBe(0);
      expect(game.getCurrentQuestion()).toBeNull();
    });
  });

  describe('addPlayer', () => {
    it('should add a player successfully', () => {
      const player = game.addPlayer('user-1', 'Player 1', 'socket-1');
      expect(player).toBeDefined();
      expect(player.id).toBe('user-1');
      expect(game.getPlayerCount()).toBe(1);
    });

    it('should throw if game is not in LOBBY state', () => {
      game.state = GameState.QUESTION_ACTIVE;
      expect(() => game.addPlayer('user-1', 'Player 1', 'socket-1')).toThrow(BadRequestException);
    });

    it('should throw if player already exists', () => {
      game.addPlayer('user-1', 'Player 1', 'socket-1');
      expect(() => game.addPlayer('user-1', 'Player 1', 'socket-1')).toThrow(BadRequestException);
    });
  });

  describe('start', () => {
    it('should start the game successfully', () => {
      game.addPlayer('user-1', 'Player 1', 'socket-1');
      
      const onQuestionEnd = jest.fn();
      game.start(onQuestionEnd);

      expect(game.state).toBe(GameState.QUESTION_ACTIVE);
      const currentQ = game.getCurrentQuestion();
      expect(currentQ).toBeDefined();
      expect(currentQ?.id).toBe(mockQuiz.questions[0].id);
      expect(currentQ).not.toHaveProperty('correctOptionIndex'); // Should not expose answer
    });

    it('should throw when starting with no players', () => {
      expect(() => game.start(jest.fn())).toThrow(BadRequestException);
    });
  });

  describe('submitAnswer', () => {
    beforeEach(() => {
        game.addPlayer('user-1', 'Player 1', 'socket-1');
        game.start(jest.fn());
    });

    it('should calculate score correctly for correct answer', () => {
        // We need to ensure some time has passed if we want slightly less than max points,
        // but hrtime is hard to mock precisely without a library. 
        // We assume 0 elapsed roughly for immediate answer.
        
        // Mock process.hrtime.bigint to simulate immediate answer after start
        // Be careful game.start() sets questionStartTime using process.hrtime.bigint()
        
        const result = game.submitAnswer('user-1', 0); // Correct answer index is 0
        expect(result.isCorrect).toBe(true);
        expect(result.points).toBeGreaterThan(0);
        expect(game.getPlayer('user-1')?.totalScore).toBe(result.points);
    });

    it('should handle wrong answer', () => {
        const result = game.submitAnswer('user-1', 1); // Wrong answer
        expect(result.isCorrect).toBe(false);
        expect(result.points).toBe(0);
        expect(game.getPlayer('user-1')?.currentCombo).toBe(0);
    });

    it('should throw if answer already submitted', () => {
        game.submitAnswer('user-1', 0);
        expect(() => game.submitAnswer('user-1', 0)).toThrow(BadRequestException);
    });
  });

  describe('nextQuestion', () => {
    it('should advance to next question', () => {
       game.addPlayer('user-1', 'Player 1', 'socket-1');
       game.start(jest.fn());
       
       // Force state to LEADERBOARD to allow nextQuestion
       game.endCurrentQuestion();
       game.showLeaderboard();

       const hasNext = game.nextQuestion(jest.fn());
       expect(hasNext).toBe(true);
       const currentQ = game.getCurrentQuestion();
       expect(currentQ?.id).toBe(mockQuiz.questions[1].id);
       expect(currentQ).not.toHaveProperty('correctOptionIndex'); // Should not expose answer
    });

    it('should end game after last question', () => {
        game.addPlayer('user-1', 'Player 1', 'socket-1');
        game.start(jest.fn());

        // Question 1 -> End -> Leaderboard -> Next (Q2)
        game.endCurrentQuestion();
        game.showLeaderboard();
        game.nextQuestion(jest.fn());

        // Question 2 -> End -> Leaderboard -> Next (End Game)
        game.endCurrentQuestion();
        game.showLeaderboard();
        
        const hasNext = game.nextQuestion(jest.fn());
        expect(hasNext).toBe(false);
        expect(game.state).toBe(GameState.ENDED);
    });
  });
});
