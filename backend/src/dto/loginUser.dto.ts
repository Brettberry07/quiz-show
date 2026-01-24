import { IsString, IsNotEmpty } from "class-validator";

export class LoginUserDto {
  @IsString({ message: "Username must be a string" })
  @IsNotEmpty({ message: "Username is required" })
  username: string;
}
