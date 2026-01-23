import { IsInt, Min } from "class-validator";

export class SubmitAnswerDto {
  @IsInt({ message: "Answer index must be an integer" })
  @Min(0, { message: "Answer index must be non-negative" })
  answerIndex: number;
}
