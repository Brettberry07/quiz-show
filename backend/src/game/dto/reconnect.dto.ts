import { IsNotEmpty, IsString } from "class-validator";

export class ReconnectDto {
  @IsString({ message: "Socket ID must be a string" })
  @IsNotEmpty({ message: "Socket ID is required" })
  socketId: string;
}
