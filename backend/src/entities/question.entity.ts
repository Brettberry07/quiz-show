import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { QuizEntity } from "./quiz.entity";
import { QuestionType } from "../game/game.types";

@Entity({ name: "questions" })
export class QuestionEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => QuizEntity, (quiz) => quiz.questions, { onDelete: "CASCADE" })
  quiz: QuizEntity;

  @Column()
  text: string;

  @Column({ nullable: true })
  category?: string;

  @Column({ nullable: true })
  author?: string;

  @Column({ type: "text" })
  type: QuestionType;

  @Column()
  timeLimitSeconds: number;

  @Column("float")
  pointsMultiplier: number;

  @Column({ type: "simple-json" })
  options: string[];

  @Column()
  correctOptionIndex: number;
}
