import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { AuthModule } from 'src/auth/auth.module';
import { GameModule } from 'src/game/game.module';
import { QuizEntity } from '../entities/quiz.entity';
import { QuestionEntity } from '../entities/question.entity';

@Module({
    imports: [
        AuthModule,
        forwardRef(() => GameModule), // Forward reference to avoid circular dependency
        TypeOrmModule.forFeature([QuizEntity, QuestionEntity]),
    ],
    controllers: [QuizController],
    providers: [QuizService],
    exports: [QuizService] // Export for GameModule to access quiz data
})
export class QuizModule {}
