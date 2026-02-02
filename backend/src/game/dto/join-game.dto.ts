import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class JoinGameDto {
  @IsString({ message: "Nickname must be a string" })
  @IsNotEmpty({ message: "Nickname is required" })
  @MaxLength(20, { message: `Nickname must be at most 20 characters` })
  nickname: string;

  @IsString({ message: "Socket ID must be a string" })
  @IsOptional()
  socketId?: string;
}
