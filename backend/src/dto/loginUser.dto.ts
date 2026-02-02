import { IsString, IsNotEmpty, IsLowercase } from "class-validator";

export class LoginUserDto {
  @IsString({ message: "Username must be a string" })
  @IsNotEmpty({ message: "Username is required" })
  @IsLowercase({ message: "Username must be lowercase" })
  username: string;
}
