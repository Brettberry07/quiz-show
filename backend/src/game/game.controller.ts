import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { GameService } from "./game.service";
import { QuizService } from "../quiz/quiz.service";
import { CreateGameDto } from "./dto/create-game.dto";
import { JoinGameDto } from "./dto/join-game.dto";
import { SubmitAnswerDto } from "./dto/submit-answer.dto";
import { LeaderboardQueryDto } from "./dto/leaderboard-query.dto";
import { ReconnectDto } from "./dto/reconnect.dto";
import { GameState } from "./game.types";

interface AuthenticatedRequest {
  user: {
    id: string;
    username: string;
    role: string;
  };
}

@Controller("game")
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly quizService: QuizService
  ) {}

  @Post()
  async createGame(@Body() dto: CreateGameDto, @Request() req: AuthenticatedRequest) {
    const quiz = await this.quizService.getQuizForGame(dto.quizId);
    const game = this.gameService.createGame(quiz, {
      quizId: dto.quizId,
      hostUserId: req.user.id,
      hostSocketId: "rest",
    });

    return {
      message: "Game created successfully",
      status: HttpStatus.CREATED,
      data: game,
    };
  }

  @Get(":pin")
  getGameStatus(@Param("pin") pin: string) {
    const game = this.gameService.getGame(pin);

    return {
      message: "Game status retrieved",
      status: HttpStatus.OK,
      data: {
        ...game.getSafeSummary(),
        hostId: game.hostUserId,
        currentQuestionIndex: game.getCurrentQuestionIndex(),
        totalQuestions: game.getTotalQuestions(),
        startedAt: game.startedAt,
      },
    };
  }

  @Post(":pin/join")
  joinGame(
    @Param("pin") pin: string,
    @Body() dto: JoinGameDto,
    @Request() req: AuthenticatedRequest
  ) {
    const result = this.gameService.addPlayer({
      pin,
      userId: req.user.id,
      nickname: dto.nickname,
      socketId: dto.socketId || "rest",
    });

    return {
      message: "Player joined successfully",
      status: HttpStatus.OK,
      data: {
        pin,
        playerId: result.playerId,
        player: result.player,
      },
    };
  }

  @Post(":pin/leave")
  leaveGame(@Param("pin") pin: string, @Request() req: AuthenticatedRequest) {
    this.gameService.removePlayer(pin, req.user.id);
    return {
      message: "Player removed successfully",
      status: HttpStatus.OK,
      data: { removed: true },
    };
  }

  @Post(":pin/reconnect")
  reconnectPlayer(
    @Param("pin") pin: string,
    @Body() dto: ReconnectDto,
    @Request() req: AuthenticatedRequest
  ) {
    this.gameService.updatePlayerSocket(pin, req.user.id, dto.socketId);
    return {
      message: "Player reconnected",
      status: HttpStatus.OK,
      data: { socketId: dto.socketId },
    };
  }

  @Post(":pin/start")
  startGame(@Param("pin") pin: string, @Request() req: AuthenticatedRequest) {
    const game = this.gameService.getGame(pin);
    if (!game.isHost(req.user.id)) {
      throw new ForbiddenException("Only the host can start the game");
    }

    this.gameService.startGame(pin);

    return {
      message: "Game started",
      status: HttpStatus.OK,
      data: {
        pin,
        startedAt: game.startedAt,
        currentQuestionIndex: game.getCurrentQuestionIndex(),
      },
    };
  }

  @Get(":pin/question")
  getCurrentQuestion(@Param("pin") pin: string, @Request() req: AuthenticatedRequest) {
    const game = this.gameService.getGame(pin);
    const question = this.gameService.getCurrentQuestion(pin);
    const timeRemainingMs = game.getTimeRemainingMs();

    const payload: Record<string, unknown> = {
      pin,
      state: game.state,
      question,
      timeRemainingMs,
      currentQuestionIndex: game.getCurrentQuestionIndex(),
      totalQuestions: game.getTotalQuestions(),
    };

    if (game.isHost(req.user.id) && game.state !== GameState.QUESTION_ACTIVE) {
      payload.correctOptionIndex = this.gameService.getCorrectAnswer(pin);
    }

    return {
      message: "Current question retrieved",
      status: HttpStatus.OK,
      data: payload,
    };
  }

  @Post(":pin/answer")
  submitAnswer(
    @Param("pin") pin: string,
    @Body() dto: SubmitAnswerDto,
    @Request() req: AuthenticatedRequest
  ) {
    try {
      const result = this.gameService.submitAnswer({
        pin,
        playerId: req.user.id,
        answerIndex: dto.answerIndex,
      });

      return {
        message: "Answer submitted",
        status: HttpStatus.OK,
        data: result,
      };
    } catch (error: any) {
      if (error?.message?.includes("Answer already submitted")) {
        throw new ConflictException("Answer already submitted for this question");
      }
      throw error;
    }
  }

  @Post(":pin/question/end")
  endQuestion(@Param("pin") pin: string, @Request() req: AuthenticatedRequest) {
    const game = this.gameService.getGame(pin);
    if (!game.isHost(req.user.id)) {
      throw new ForbiddenException("Only the host can end the question");
    }

    this.gameService.endCurrentQuestion(pin);

    return {
      message: "Question ended",
      status: HttpStatus.OK,
      data: {
        correctOptionIndex: this.gameService.getCorrectAnswer(pin),
        state: game.state,
      },
    };
  }

  @Post(":pin/leaderboard/show")
  showLeaderboard(@Param("pin") pin: string, @Request() req: AuthenticatedRequest) {
    const game = this.gameService.getGame(pin);
    if (!game.isHost(req.user.id)) {
      throw new ForbiddenException("Only the host can show the leaderboard");
    }

    this.gameService.showLeaderboard(pin);
    return {
      message: "Leaderboard revealed",
      status: HttpStatus.OK,
      data: { state: game.state },
    };
  }

  @Get(":pin/leaderboard")
  getLeaderboard(@Param("pin") pin: string, @Query() query: LeaderboardQueryDto) {
    const entries = this.gameService.getLeaderboard(pin, query.limit || 5);
    const game = this.gameService.getGame(pin);

    return {
      message: "Leaderboard retrieved",
      status: HttpStatus.OK,
      data: {
        entries,
        state: game.state,
        currentQuestionIndex: game.getCurrentQuestionIndex(),
        totalQuestions: game.getTotalQuestions(),
      },
    };
  }

  @Post(":pin/question/next")
  nextQuestion(@Param("pin") pin: string, @Request() req: AuthenticatedRequest) {
    const game = this.gameService.getGame(pin);
    if (!game.isHost(req.user.id)) {
      throw new ForbiddenException("Only the host can advance the game");
    }

    const hasMore = this.gameService.nextQuestion(pin);

    return {
      message: hasMore ? "Next question started" : "Game ended",
      status: HttpStatus.OK,
      data: {
        hasMoreQuestions: hasMore,
        state: game.state,
        currentQuestionIndex: game.getCurrentQuestionIndex(),
        totalQuestions: game.getTotalQuestions(),
      },
    };
  }

  @Post(":pin/end")
  endGame(@Param("pin") pin: string, @Request() req: AuthenticatedRequest) {
    const game = this.gameService.getGame(pin);
    if (!game.isHost(req.user.id)) {
      throw new ForbiddenException("Only the host can end the game");
    }

    this.gameService.endGame(pin);

    return {
      message: "Game ended",
      status: HttpStatus.OK,
      data: {
        state: game.state,
        leaderboard: this.gameService.getLeaderboard(pin, 10),
      },
    };
  }

  @Delete(":pin")
  deleteGame(@Param("pin") pin: string, @Request() req: AuthenticatedRequest) {
    const game = this.gameService.getGame(pin);
    if (!game.isHost(req.user.id)) {
      throw new ForbiddenException("Only the host can delete the game");
    }

    this.gameService.deleteGame(pin);
    return {
      message: "Game deleted",
      status: HttpStatus.OK,
      data: { deleted: true },
    };
  }
}
