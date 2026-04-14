import { Module, Global } from "@nestjs/common";
import Database from "better-sqlite3";
import { DbService } from "./db.service";

@Global()
@Module({
  providers: [
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: () => {
        const db = new Database(process.env.DATABASE_PATH || './data/database.db');
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');

        db.exec(`
          CREATE TABLE IF NOT EXISTS user (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            refreshTokenHash TEXT
          );
          CREATE TABLE IF NOT EXISTS quizzes (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            hostId TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
          );
          CREATE TABLE IF NOT EXISTS questions (
            id TEXT PRIMARY KEY,
            quizId TEXT,
            text TEXT NOT NULL,
            category TEXT,
            author TEXT,
            type TEXT NOT NULL,
            timeLimitSeconds INTEGER NOT NULL,
            pointsMultiplier REAL NOT NULL,
            options TEXT NOT NULL,
            correctOptionIndex INTEGER NOT NULL,
            FOREIGN KEY (quizId) REFERENCES quizzes (id) ON DELETE CASCADE
          );
        `);
        return db;
      },
    },
    DbService,
  ],
  exports: ['DATABASE_CONNECTION', DbService],
})
export class DbModule {}
