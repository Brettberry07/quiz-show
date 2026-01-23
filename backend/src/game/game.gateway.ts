import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UseGuards, Logger, ForbiddenException } from '@nestjs/common';
import { Server } from 'socket.io';
import { GameService } from './game.service';
import { QuizService } from '../quiz/quiz.service';
import { WsJwtGuard } from '../auth/ws-jwt.guard';
import type { AuthedSocket } from '../auth/ws-jwt.guard';
import { GameEventsService } from './game-events.service';
import { GameState } from './game.types';

interface CreateGamePayload { quizId: string }
interface JoinGamePayload { pin: string; nickname: string }
interface SubmitAnswerPayload { pin: string; answerIndex: number }
interface PinPayload { pin: string }

@WebSocketGateway({ namespace: 'game', cors: { origin: true, credentials: true } })
@UseGuards(WsJwtGuard)
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);

  constructor(
    private readonly gameService: GameService,
    private readonly quizService: QuizService,
    private readonly gameEvents: GameEventsService,
  ) {}

  afterInit(server: Server) {
    this.gameEvents.setServer(server);
    this.logger.log('Game gateway initialized');
  }

  handleConnection(client: AuthedSocket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: AuthedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('create_game')
  async handleCreateGame(
    @MessageBody() payload: CreateGamePayload,
    @ConnectedSocket() client: AuthedSocket,
  ) {
    const quiz = await this.quizService.getQuizForGame(payload.quizId);
    const game = this.gameService.createGame(quiz, {
      quizId: payload.quizId,
      hostUserId: client.data.user?.id ?? 'unknown',
      hostSocketId: client.id,
    });

    client.join(game.pin);
    this.logger.log(`Host ${client.data.user?.id} created game ${game.pin}`);

    return {
      status: 'ok',
      data: game,
    };
  }

  @SubscribeMessage('join_game')
  async handleJoinGame(
    @MessageBody() payload: JoinGamePayload,
    @ConnectedSocket() client: AuthedSocket,
  ) {
    try {
      const result = this.gameService.addPlayer({
        pin: payload.pin,
        userId: client.data.user?.id ?? 'unknown',
        nickname: payload.nickname,
        socketId: client.id,
      });

      client.join(payload.pin);
      this.gameEvents.emitToPin(payload.pin, 'player_joined', {
        pin: payload.pin,
        player: result.player,
      });

      return {
        status: 'ok',
        data: {
          pin: payload.pin,
          playerId: result.playerId,
          player: result.player,
          rejoined: result.rejoined ?? false,
        },
      };
    } catch (error: any) {
      if (error?.message?.includes('already in this game')) {
        this.gameService.updatePlayerSocket(payload.pin, client.data.user?.id ?? 'unknown', client.id);
        client.join(payload.pin);
        return {
          status: 'ok',
          data: {
            pin: payload.pin,
            rejoined: true,
          },
        };
      }
      throw error;
    }
  }

  @SubscribeMessage('sync_state')
  async handleSyncState(
    @MessageBody() payload: PinPayload,
    @ConnectedSocket() client: AuthedSocket,
  ) {
    const game = this.gameService.getGame(payload.pin);
    client.join(payload.pin);

    return {
      status: 'ok',
      data: {
        state: game.state,
        pin: payload.pin,
        question: this.gameService.getCurrentQuestion(payload.pin),
        timeRemainingMs: game.getTimeRemainingMs(),
        currentQuestionIndex: game.getCurrentQuestionIndex(),
        totalQuestions: game.getTotalQuestions(),
        hostId: game.hostUserId,
        quizId: game.getQuizId(),
        playerCount: game.getPlayerCount(),
        leaderboard: game.state === 'leaderboard' || game.state === 'ended'
          ? this.gameService.getLeaderboard(payload.pin, 10)
          : undefined,
      },
    };
  }

  @SubscribeMessage('start_game')
  async handleStartGame(
    @MessageBody() payload: PinPayload,
    @ConnectedSocket() client: AuthedSocket,
  ) {
    const game = this.gameService.getGame(payload.pin);
    if (!game.isHost(client.data.user?.id ?? '')) {
      throw new ForbiddenException('Only the host can start the game');
    }
    this.gameService.startGame(payload.pin);
    return { status: 'ok', data: { state: GameState.QUESTION_ACTIVE } };
  }

  @SubscribeMessage('submit_answer')
  async handleSubmitAnswer(
    @MessageBody() payload: SubmitAnswerPayload,
    @ConnectedSocket() client: AuthedSocket,
  ) {
    const result = this.gameService.submitAnswer({
      pin: payload.pin,
      playerId: client.data.user?.id ?? 'unknown',
      answerIndex: payload.answerIndex,
    });

    return {
      status: 'ok',
      data: result,
    };
  }

  @SubscribeMessage('end_question')
  async handleEndQuestion(
    @MessageBody() payload: PinPayload,
    @ConnectedSocket() client: AuthedSocket,
  ) {
    const game = this.gameService.getGame(payload.pin);
    if (!game.isHost(client.data.user?.id ?? '')) {
      throw new ForbiddenException('Only the host can end the question');
    }
    this.gameService.endCurrentQuestion(payload.pin);
    this.gameService.showLeaderboard(payload.pin);
    return { status: 'ok', data: { state: game.state } };
  }

  @SubscribeMessage('show_leaderboard')
  async handleShowLeaderboard(
    @MessageBody() payload: PinPayload,
    @ConnectedSocket() client: AuthedSocket,
  ) {
    const game = this.gameService.getGame(payload.pin);
    if (!game.isHost(client.data.user?.id ?? '')) {
      throw new ForbiddenException('Only the host can show the leaderboard');
    }
    this.gameService.showLeaderboard(payload.pin);
    return { status: 'ok', data: { state: game.state } };
  }

  @SubscribeMessage('next_question')
  async handleNextQuestion(
    @MessageBody() payload: PinPayload,
    @ConnectedSocket() client: AuthedSocket,
  ) {
    const game = this.gameService.getGame(payload.pin);
    const userId = client.data.user?.id ?? '';
    this.logger.debug(`next_question requested pin=${payload.pin} user=${userId} state=${game.state}`);
    if (!game.isHost(userId)) {
      this.logger.warn(`next_question forbidden pin=${payload.pin} user=${userId}`);
      throw new ForbiddenException('Only the host can advance the game');
    }
    try {
      // Ensure we are in a safe state to advance: auto-end active or processing states
      if (game.state === GameState.QUESTION_ACTIVE) {
        this.logger.debug(`next_question: forcing endCurrentQuestion pin=${payload.pin}`);
        this.gameService.endCurrentQuestion(payload.pin);
        this.logger.debug(`next_question: forcing showLeaderboard pin=${payload.pin}`);
        this.gameService.showLeaderboard(payload.pin);
      } else if (game.state === GameState.PROCESSING) {
        this.logger.debug(`next_question: processing->leaderboard pin=${payload.pin}`);
        this.gameService.showLeaderboard(payload.pin);
      }

      const hasMore = this.gameService.nextQuestion(payload.pin);
      this.logger.debug(`next_question: result pin=${payload.pin} hasMore=${hasMore}`);
      return { status: 'ok', data: { hasMore } };
    } catch (error) {
      this.logger.error(`next_question error pin=${payload.pin} state=${game.state}: ${error}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @SubscribeMessage('end_game')
  async handleEndGame(
    @MessageBody() payload: PinPayload,
    @ConnectedSocket() client: AuthedSocket,
  ) {
    const game = this.gameService.getGame(payload.pin);
    if (!game.isHost(client.data.user?.id ?? '')) {
      throw new ForbiddenException('Only the host can end the game');
    }
    this.gameService.endGame(payload.pin);
    return { status: 'ok', data: { state: game.state } };
  }
}