import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export const NICKNAME_MAX_LENGTH = 20;

export class JoinGameDto {
  @IsString({ message: "Nickname must be a string" })
  @IsNotEmpty({ message: "Nickname is required" })
  @MaxLength(NICKNAME_MAX_LENGTH, { message: `Nickname must be at most ${NICKNAME_MAX_LENGTH} characters` })
  nickname: string;

  @IsString({ message: "Socket ID must be a string" })
  @IsOptional()
  socketId?: string;
}
