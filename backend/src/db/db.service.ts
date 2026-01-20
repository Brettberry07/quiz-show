import {
	ConflictException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class DbService {
	constructor(
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
		// private readonly authService: AuthService, // Cannot use AuthService
	) {}
	// TODO: Remove findAll() method, replace require parameters
	async findAll(): Promise<User[]> {
		return await this.userRepository.find();
	}

	async create(user: Partial<User>): Promise<User | undefined> {
		// Check for existing user by username
		if (user.username) {
			const existingUserByUsername = await this.findOne(undefined, user.username);
			
			if (existingUserByUsername) {
				throw new ConflictException('User already exists');
			}
		}
		
		const newUser = this.userRepository.create(user);
		return await this.userRepository.save(newUser);
	}

	async findOne(uuid?: string, username?: string): Promise<User | null> {
		if (uuid) {
			return await this.userRepository.findOne({ where: { id: uuid } });
		}
		if (username) {
			return await this.userRepository.findOne({ where: { username } });
		}
		return null;
	}

	async remove(uuid: string): Promise<User | undefined> {
		const user = await this.userRepository.findOne({
			where: { id: uuid },
		});
		if (!user) {
			return undefined;
		}
		await this.userRepository.remove(user);
		return user;
	}
	
	async SaveRefreshToken(userId: string, refreshTokenHash: string): Promise<void> {
		let user: User | null;
		if (!(user = await this.findOne(userId, undefined))) {
			throw new UnauthorizedException();
		}
		user.refreshTokenHash = refreshTokenHash;
		await this.userRepository.save(user);
	}
}

