import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
import { QuizEntity } from "../entities/quiz.entity";
import { QuestionEntity } from "../entities/question.entity";
import { DbService } from "./db.service";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DATABASE_PATH || './data/database.db',
      entities: [User, QuizEntity, QuestionEntity],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([User, QuizEntity, QuestionEntity])
  ],
  providers: [DbService],
  exports: [DbService],
})
export class DbModule {}
