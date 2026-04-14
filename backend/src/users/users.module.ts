import { Module, forwardRef } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { DbModule } from "../db/db.module";
import { JwtModule } from "../jwt/jwt.module";
import { AuthModule } from "../auth/auth.module";

// This uses forwardRef to avoid circular dependency issues
@Module({
  imports: [
    DbModule,
    forwardRef(() => JwtModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [UsersController],
})
export class UsersModule {}
