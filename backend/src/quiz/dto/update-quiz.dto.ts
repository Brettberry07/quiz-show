import { IsString, IsOptional, IsArray, ValidateNested, IsEnum, IsNumber, Min, IsInt, ArrayMinSize, IsNotEmpty, registerDecorator, ValidationOptions, ValidationArguments } from "class-validator";
import { Type } from "class-transformer";
import { QuestionType } from "../../game/game.types";

/**
 * Custom validator to ensure correctOptionIndex is within bounds of options array
 */
function IsValidOptionIndex(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidOptionIndex',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          if (value === undefined || value === null) {
            return true; // Let @IsOptional handle this
          }
          if (!obj.options || !Array.isArray(obj.options)) {
            return false;
          }
          return typeof value === 'number' && value >= 0 && value < obj.options.length;
        },
        defaultMessage(args: ValidationArguments) {
          const obj = args.object as any;
          const optionsLength = obj.options?.length || 0;
          return `Correct option index must be between 0 and ${optionsLength - 1}`;
        }
      }
    });
  };
}

/**
 * DTO for updating a question
 */
export class UpdateQuestionDto {
  @IsString({ message: "Question ID must be a string" })
  @IsNotEmpty({ message: "Question ID is required for updates" })
  id: string;

  @IsString({ message: "Question text must be a string" })
  @IsOptional()
  text?: string;

  @IsEnum(QuestionType, { message: "Invalid question type" })
  @IsOptional()
  type?: QuestionType;

  @IsNumber({}, { message: "Time limit must be a number" })
  @Min(5, { message: "Time limit must be at least 5 seconds" })
  @IsOptional()
  timeLimitSeconds?: number;

  @IsNumber({}, { message: "Points multiplier must be a number" })
  @Min(0.1, { message: "Points multiplier must be at least 0.1" })
  @IsOptional()
  pointsMultiplier?: number;

  @IsArray({ message: "Options must be an array" })
  @IsString({ each: true, message: "Each option must be a string" })
  @ArrayMinSize(2, { message: "At least 2 options are required" })
  @IsOptional()
  options?: string[];

  @IsInt({ message: "Correct option index must be an integer" })
  @Min(0, { message: "Correct option index must be non-negative" })
  @IsValidOptionIndex({ message: "Correct option index must be within the bounds of the options array" })
  @IsOptional()
  correctOptionIndex?: number;
}

/**
 * DTO for adding a new question to an existing quiz
 */
export class AddQuestionDto {
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
  @IsValidOptionIndex({ message: "Correct option index must be within the bounds of the options array" })
  correctOptionIndex: number;
}

/**
 * DTO for updating a quiz
 */
export class UpdateQuizDto {
  @IsString({ message: "Title must be a string" })
  @IsOptional()
  title?: string;

  @IsArray({ message: "Questions must be an array" })
  @ValidateNested({ each: true })
  @Type(() => UpdateQuestionDto)
  @IsOptional()
  questions?: UpdateQuestionDto[];
}
