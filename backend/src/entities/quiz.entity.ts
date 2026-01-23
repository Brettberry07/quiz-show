import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { QuestionEntity } from "./question.entity";

@Entity({ name: "quizzes" })
export class QuizEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column()
  hostId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => QuestionEntity, (question) => question.quiz, {
    cascade: true,
    eager: true,
  })
  questions: QuestionEntity[];
}
