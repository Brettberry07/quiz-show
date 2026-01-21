import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [QuizController],
    providers: [QuizService],
    exports: [QuizService] // Export for GameModule to access quiz data
})
export class QuizModule {}
