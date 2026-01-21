import { Module } from "@nestjs/common";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { JwtModule } from "./jwt/jwt.module";
import { DbModule } from "./db/db.module";
import { GameModule } from "./game/game.module";
import { ConfigModule } from "@nestjs/config";
// import { WebsocketModule } from './websocket/websocket.module';
import { QuizModule } from "./quiz/quiz.module";

/** DO NOT DELETE
 * app.module is the master module that imports all other modules
 * Deleting app.module means that no other modules would be runnable
 *
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Allow dynamic resolution: prefer process.env already injected by Docker, fallback to file
      envFilePath: [
        process.env.NODE_ENV ? `./src/.env.${process.env.NODE_ENV}` : "",
        "./src/.env",
      ].filter(Boolean),
    }),
    UsersModule,
    AuthModule,
    JwtModule,
    GameModule,
    DbModule,
    // WebsocketModule,
    QuizModule
  ],
})
export class AppModule {}
