import { IsString, IsNotEmpty, IsArray, ValidateNested, IsEnum, IsNumber, Min, IsInt, ArrayMinSize } from "class-validator";
import { Type } from "class-transformer";
import { QuestionType } from "../../game/game.types";

/**
 * DTO for creating a new question within a quiz
 */
export class CreateQuestionDto {
  @IsString({ message: "Question text must be a string" })
  @IsNotEmpty({ message: "Question text is required" })
  text: string;

  @IsEnum(QuestionType, { message: "Invalid question type" })
  type: QuestionType;

  @IsNumber({}, { message: "Time limit must be a number" })
  @Min(5, { message: "Time limit must be at least 5 seconds" })
  timeLimitSeconds: number;

  @IsNumber({}, { message: "Points multiplier must be a number" })
  @Min(0.1, { message: "Points multiplier must be at least 0.1" })
  pointsMultiplier: number;

  @IsArray({ message: "Options must be an array" })
  @IsString({ each: true, message: "Each option must be a string" })
  @ArrayMinSize(2, { message: "At least 2 options are required" })
  options: string[];

  @IsInt({ message: "Correct option index must be an integer" })
  @Min(0, { message: "Correct option index must be non-negative" })
  correctOptionIndex: number;
}

/**
 * DTO for creating a new quiz
 */
export class CreateQuizDto {
  @IsString({ message: "Title must be a string" })
  @IsNotEmpty({ message: "Title is required" })
  title: string;

  @IsArray({ message: "Questions must be an array" })
  @ArrayMinSize(1, { message: "At least 1 question is required" })
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}
    