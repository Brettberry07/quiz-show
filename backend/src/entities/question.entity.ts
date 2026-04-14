import { QuizEntity } from "./quiz.entity";
import { QuestionType } from "../game/game.types";

export class QuestionEntity {
  id: string;
  quiz?: QuizEntity;
  quizId?: string;
  text: string;
  category?: string;
  author?: string;
  type: QuestionType;
  timeLimitSeconds: number;
  pointsMultiplier: number;
  options: string[] | string;
  correctOptionIndex: number;
}
