import { IsInt, IsOptional, Max, Min } from "class-validator";

export class LeaderboardQueryDto {
  @IsOptional()
  @IsInt({ message: "Limit must be an integer" })
  @Min(1, { message: "Limit must be at least 1" })
  @Max(50, { message: "Limit cannot exceed 50" })
  limit?: number;
}
