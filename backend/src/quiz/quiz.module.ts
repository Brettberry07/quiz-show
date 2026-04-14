import { Module, forwardRef } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { AuthModule } from 'src/auth/auth.module';
import { GameModule } from 'src/game/game.module';
import { DbModule } from 'src/db/db.module';

@Module({
    imports: [
        AuthModule,
        forwardRef(() => GameModule), // Forward reference to avoid circular dependency
        DbModule,
    ],
    controllers: [QuizController],
    providers: [QuizService],
    exports: [QuizService] // Export for GameModule to access quiz data
})
export class QuizModule {}
