import { QuestionEntity } from "./question.entity";

export class QuizEntity {
  id: string;
  title: string;
  hostId: string;
  createdAt: Date;
  updatedAt: Date;
  questions: QuestionEntity[];
}
