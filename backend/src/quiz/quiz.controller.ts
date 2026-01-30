import { 
    Controller, 
    Delete, 
    Get, 
    Patch, 
    Post, 
    UseGuards,
    Body,
    Param,
    Request,
    HttpCode,
    HttpStatus,
    Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { QuizService } from './quiz.service';
import { GameService } from '../game/game.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto, AddQuestionDto } from './dto/update-quiz.dto';
import { PaginationDto } from './dto/pagination.dto';

interface AuthenticatedRequest {
    user: {
        id: string;
        username: string;
    };
}

@Controller('quiz')
@UseGuards(JwtAuthGuard)
export class QuizController {
    constructor(
        private readonly quizService: QuizService,
        private readonly gameService: GameService,
    ) {}

    /**
     * Create a new quiz
     * 
     * @param createQuizDto - The quiz creation data
     * @param req - The authenticated request containing user info
     * @returns The created quiz object
     * 
     * @example
     * POST /quiz
     * {
     *   "title": "My Quiz",
     *   "questions": [
     *     {
     *       "text": "What is 2+2?",
     *       "type": "MULTIPLE_CHOICE",
     *       "timeLimitSeconds": 30,
     *       "pointsMultiplier": 1,
     *       "options": ["3", "4", "5", "6"],
     *       "correctOptionIndex": 1
     *     }
     *   ]
     * }
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createQuiz(
        @Body() createQuizDto: CreateQuizDto,
        @Request() req: AuthenticatedRequest,
    ) {
        const quiz = await this.quizService.createQuiz(createQuizDto, req.user.id, req.user.username);
        return {
            message: 'Quiz created successfully',
            data: quiz.getSummary(),
        };
    }

    /**
     * Retrieve all quizzes (summaries) with pagination
     * 
     * @param paginationDto - Pagination parameters (page and limit)
     * @returns Paginated array of quiz summaries
     * 
     * @example
     * GET /quiz?page=1&limit=10
     */
    @Get()
    async findAll(@Query() paginationDto: PaginationDto) {
        const result = await this.quizService.findAll(
            paginationDto.page,
            paginationDto.limit,
        );
        return {
            message: 'Quizzes retrieved successfully',
            ...result,
        };
    }

    /**
     * Retrieve all quizzes owned by the current user
     * 
     * @param req - The authenticated request
     * @returns Array of quiz summaries owned by the user
     */
    @Get('my')
    async findMyQuizzes(@Request() req: AuthenticatedRequest) {
        const quizzes = await this.quizService.findAllByHost(req.user.id);
        return {
            message: 'Your quizzes retrieved successfully',
            data: quizzes,
        };
    }

    /**
     * Get quiz statistics
     * 
     * @returns Statistics about quizzes in the system
     */
    @Get('stats')
    async getStats() {
        return {
            message: 'Quiz statistics retrieved',
            data: await this.quizService.getStats(),
        };
    }

    /**
     * Validate if a quiz can be played
     * 
     * @param id - The quiz ID
     * @returns Validation result
     */
    @Get(':id/validate')
    async validateQuiz(@Param('id') id: string) {
        const validation = await this.quizService.validateForGame(id);
        return {
            message: validation.valid ? 'Quiz is valid' : 'Quiz validation failed',
            data: validation,
        };
    }

    /**
     * Retrieve a single quiz by ID
     * Returns full details including correct answers only if requester is the host
     * 
     * @param id - The quiz ID
     * @param req - The authenticated request
     * @returns The quiz object (answers hidden unless you're the host)
     */
    @Get(':id')
    async findOne(
        @Param('id') id: string,
        @Request() req: AuthenticatedRequest,
    ) {
        const quiz = await this.quizService.findOneForClient(id, req.user.id);
        return {
            message: 'Quiz retrieved successfully',
            data: quiz,
        };
    }

    /**
     * Update a quiz
     * 
     * @param id - The quiz ID
     * @param updateQuizDto - The update data
     * @param req - The authenticated request
     * @returns The updated quiz
     */
    @Patch(':id')
    async updateQuiz(
        @Param('id') id: string,
        @Body() updateQuizDto: UpdateQuizDto,
        @Request() req: AuthenticatedRequest,
    ) {
        const quiz = await this.quizService.update(id, updateQuizDto, req.user.id);
        return {
            message: 'Quiz updated successfully',
            data: quiz.getSummary(),
        };
    }

    /**
     * Add a question to an existing quiz
     * 
     * @param id - The quiz ID
     * @param addQuestionDto - The question data
     * @param req - The authenticated request
     * @returns The created question
     */
    @Post(':id/questions')
    @HttpCode(HttpStatus.CREATED)
    async addQuestion(
        @Param('id') id: string,
        @Body() addQuestionDto: AddQuestionDto,
        @Request() req: AuthenticatedRequest,
    ) {
        const question = await this.quizService.addQuestion(id, addQuestionDto, req.user.id, req.user.username);
        return {
            message: 'Question added successfully',
            data: question.getSafeQuestion(),
        };
    }

    /**
     * Add a question to a game's quiz (for players in a game lobby)
     * Players can contribute ONE question before the game starts
     * 
     * @param pin - The game PIN
     * @param addQuestionDto - The question data
     * @param req - The authenticated request
     * @returns The created question
     */
    @Post('game/:pin/questions')
    @HttpCode(HttpStatus.CREATED)
    async addQuestionToGame(
        @Param('pin') pin: string,
        @Body() addQuestionDto: AddQuestionDto,
        @Request() req: AuthenticatedRequest,
    ) {
        // Validate that the player can contribute (in game, hasn't contributed yet, game in lobby)
        const quizId = this.gameService.validatePlayerQuestionContribution(pin, req.user.id);
        
        // Add the question to the quiz permanently
        const question = await this.quizService.addQuestionForGamePlayer(quizId, addQuestionDto, req.user.id, req.user.username);
        
        return {
            message: 'Question contributed successfully to the game',
            data: question.getSafeQuestion(),
        };
    }

    /**
     * Remove a question from a quiz
     * 
     * @param id - The quiz ID
     * @param questionId - The question ID to remove
     * @param req - The authenticated request
     * @returns Success message
     */
    @Delete(':id/questions/:questionId')
    @HttpCode(HttpStatus.OK)
    async removeQuestion(
        @Param('id') id: string,
        @Param('questionId') questionId: string,
        @Request() req: AuthenticatedRequest,
    ) {
        const removed = await this.quizService.removeQuestion(id, questionId, req.user.id);
        return {
            message: removed ? 'Question removed successfully' : 'Question not found',
            data: { removed },
        };
    }

    /**
     * Delete a quiz entirely
     * 
     * @param id - The quiz ID
     * @param req - The authenticated request
     * @returns The deleted quiz summary
     */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async deleteQuiz(
        @Param('id') id: string,
        @Request() req: AuthenticatedRequest,
    ) {
        const quiz = await this.quizService.remove(id, req.user.id);
        return {
            message: 'Quiz deleted successfully',
            data: quiz.getSummary(),
        };
    }
}

