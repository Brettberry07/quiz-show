import { IsNotEmpty, IsString } from "class-validator";

export class CreateGameDto {
  @IsString({ message: "Quiz ID must be a string" })
  @IsNotEmpty({ message: "Quiz ID is required" })
  quizId: string;
}
