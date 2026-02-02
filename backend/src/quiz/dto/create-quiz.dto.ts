import { IsString, IsNotEmpty, IsArray, ValidateNested, IsEnum, IsNumber, Min, IsInt, ArrayMinSize, IsOptional, MaxLength, ArrayMaxSize } from "class-validator";
import { Type } from "class-transformer";
import { QuestionType } from "../../game/game.types";

// Character limits
export const QUESTION_TEXT_MAX_LENGTH = 200;
export const ANSWER_OPTION_MAX_LENGTH = 100;
export const CATEGORY_MAX_LENGTH = 50;
export const AUTHOR_MAX_LENGTH = 30;

/**
 * DTO for creating a new question within a quiz
 */
export class CreateQuestionDto {
  @IsString({ message: "Question text must be a string" })
  @IsNotEmpty({ message: "Question text is required" })
  @MaxLength(QUESTION_TEXT_MAX_LENGTH, { message: `Question text must be at most ${QUESTION_TEXT_MAX_LENGTH} characters` })
  text: string;

  @IsString({ message: "Category must be a string" })
  @IsOptional()
  @MaxLength(CATEGORY_MAX_LENGTH, { message: `Category must be at most ${CATEGORY_MAX_LENGTH} characters` })
  category?: string;

  @IsString({ message: "Author must be a string" })
  @IsOptional()
  @MaxLength(AUTHOR_MAX_LENGTH, { message: `Author must be at most ${AUTHOR_MAX_LENGTH} characters` })
  author?: string;

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
  @ArrayMaxSize(6, { message: "At most 6 options are allowed" })
  @MaxLength(ANSWER_OPTION_MAX_LENGTH, { each: true, message: `Each option must be at most ${ANSWER_OPTION_MAX_LENGTH} characters` })
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
    