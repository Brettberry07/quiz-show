import { Module, forwardRef } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { AuthModule } from 'src/auth/auth.module';
import { GameModule } from 'src/game/game.module';

@Module({
    imports: [
        AuthModule,
        forwardRef(() => GameModule), // Forward reference to avoid circular dependency
    ],
    controllers: [QuizController],
    providers: [QuizService],
    exports: [QuizService] // Export for GameModule to access quiz data
})
export class QuizModule {}
