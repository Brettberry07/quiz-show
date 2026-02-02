import { IsString, IsNotEmpty, MaxLength } from "class-validator";

export const USERNAME_MAX_LENGTH = 20;

export class LoginUserDto {
  @IsString({ message: "Username must be a string" })
  @IsNotEmpty({ message: "Username is required" })
  @MaxLength(USERNAME_MAX_LENGTH, { message: `Username must be at most ${USERNAME_MAX_LENGTH} characters` })
  username: string;
}
