import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class JoinGameDto {
  @IsString({ message: "Nickname must be a string" })
  @IsNotEmpty({ message: "Nickname is required" })
  nickname: string;

  @IsString({ message: "Socket ID must be a string" })
  @IsOptional()
  socketId?: string;
}
