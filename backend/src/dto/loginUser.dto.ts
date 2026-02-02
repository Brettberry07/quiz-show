import { IsString, IsNotEmpty, MaxLength } from "class-validator";

export class LoginUserDto {
  @IsString({ message: "Username must be a string" })
  @IsNotEmpty({ message: "Username is required" })
  @MaxLength(20, { message: `Username must be at most 20 characters` })
  username: string;
}
