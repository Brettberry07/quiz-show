import { Injectable, Inject } from '@nestjs/common';
import Database from 'better-sqlite3';
import { User } from '../entities/user.entity';

@Injectable()
export class DbService {
	constructor(
		@Inject('DATABASE_CONNECTION')
		private readonly db: Database.Database,
	) {}

	async findAll(): Promise<User[]> {
		return this.db.prepare('SELECT * FROM user').all() as User[];
	}

	async create(user: Partial<User>): Promise<User | undefined> {
        const crypto = require('crypto');
        const id = user.id || crypto.randomUUID();
        const stmt = this.db.prepare(`INSERT INTO user (id, username, refreshTokenHash) VALUES (?, ?, ?) RETURNING *`);
        try {
            return stmt.get(id, user.username, user.refreshTokenHash || null) as User;
        } catch (e) {
            return undefined;
        }
	}

	async findOne(uuid?: string, username?: string): Promise<User | null> {
		if (uuid) {
            const user = this.db.prepare('SELECT * FROM user WHERE id = ?').get(uuid);
            return (user as User) || null;
        }
		if (username) {
            const user = this.db.prepare('SELECT * FROM user WHERE username = ?').get(username);
            return (user as User) || null;
        }
		return null;
	}

	async remove(uuid: string): Promise<User | undefined> {
        const user = await this.findOne(uuid);
        if (!user) return undefined;
		this.db.prepare('DELETE FROM user WHERE id = ?').run(uuid);
		return user;
	}
	
	async saveRefreshToken(user: User, refreshTokenHash: string): Promise<void> {
        this.db.prepare('UPDATE user SET refreshTokenHash = ? WHERE id = ?').run(refreshTokenHash, user.id);
	}
}
