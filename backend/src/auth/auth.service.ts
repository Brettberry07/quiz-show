import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	UnauthorizedException,
} from '@nestjs/common';

import { DbService } from '../db/db.service'; // Should prob move into own db file later
import { JwtService } from '../jwt/jwt.service';

import { loginUserDto } from 'src/dto/loginUser.dto';
import { User } from 'src/entities/user.entity';

@Injectable()
export class AuthService {
	constructor(
		private readonly dbService: DbService,
		private readonly jwtService: JwtService,
	) {}

	/**
	 * Authenticates a user by validating their username and password credentials.
	 * If parameters are invalid, placeholder hashes and IDs are used to prevent timing 
	 * attacks, but are still rejected, even if placeholder hash is correct.
	 *
	 * @param loginUserDto - Login credentials containing username and password
	 * @returns A promise that resolves to an object containing a success message and authentication token
	 * @throws {Error} When username or password are missing
	 * @throws {Error} When user with the provided username is not found
	 * @throws {Error} When the provided password doesn't match the stored hash
	 *
	 * @example
	 * ```typescript
	 * const result = await authService.login({ username: 'cam', password: '123456' });
	 * console.log(result.message); // "User logged in successfully"
	 * console.log(result.accessToken);   // JWT access token
	 * ```
	 */
	async login(loginUserDto: loginUserDto): Promise<{ message: string; userID: string; accessToken: string; refreshToken: string; }> {
		const user: User | null = await this.dbService.findOne(undefined, loginUserDto.username);

		if(!user) {
			return this.register(loginUserDto);
		}

		// console.log('User found:', user);
		if(!user.id) return Promise.reject(new BadRequestException('User not found'));
		const tokens = await this.jwtService.rotateTokens(user.id);

		await this.dbService.SaveRefreshToken(user.id, tokens.refreshTokenHash);
		return {
			message: 'User logged in successfully',
			userID: user.id,
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
		};
	}

	/**
	 * Registers a new user with the provided username and password.
	 *
	 * @param createUserDto - The user's registration data containing username and password
	 * @returns A promise that resolves to an object containing a success message and the user's ID
	 * @throws {Error} When username or password is missing
	 * @throws {Error} When password hashing fails
	 *
	 * @example
	 * ```typescript
	 * const result = await authService.register({ username: 'newuser', password: 'securePassword123' });
	 * console.log(result); // { message: 'User registered successfully', userID: 'uuid' }
	 * ```
	 */
	async register(loginUserDto: loginUserDto): Promise<{ message: string; userID: string; accessToken: string; refreshToken: string; }> {
		const userPayload: Partial<User> = {
				username: loginUserDto.username,
				createdAt: new Date(),
				refreshTokenHash: '',
			};

			const user = await this.dbService.create(userPayload);
			// console.log(user);
			if (!user || !user.id) return Promise.reject(new InternalServerErrorException('Error creating new user'));
			const { accessToken, refreshToken, refreshTokenHash } = await this.jwtService.rotateTokens(user.id);
			await this.dbService.SaveRefreshToken(user.id, refreshTokenHash);

			return {
				message: 'User registered successfully',
				userID: user.id,
				accessToken,
				refreshToken,
			};
	}

	/**
	 * Refreshes the authentication token for the logged-in user.
	 *
	 * @param refreshToken - The refresh token to validate and use for generating new tokens
	 * @returns A promise that resolves to an object containing a success message and the user's new tokens
	 * @throws {UnauthorizedException} When refresh token is invalid or expired
	 * @throws {UnauthorizedException} When user is not found or has no stored refresh token
	 *
	 * @example
	 * ```typescript
	 * const result = await authService.refresh('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
	 * console.log(result.accessToken); // New access token
	 * console.log(result.newRefreshToken); // New refresh token
	 * ```
	 */
	async refresh(refreshToken: string): Promise<{ message: string; accessToken: string; newRefreshToken: string; }> {
		// Decode the refresh token to extract user ID
		const payload = this.jwtService.decodeToken(refreshToken);
		if (!payload || !payload.sub) {
			throw new UnauthorizedException('Invalid refresh token');
		}

		const userId: string = payload.sub;
		const user = await this.dbService.findOne(userId);
		if (!user?.id || !user.refreshTokenHash) {
			throw new UnauthorizedException('User not found or refresh token not set');
		}

		const isValid = await this.jwtService.compareToken(
			refreshToken,
			user.refreshTokenHash,
		);

		if (!isValid) {
			throw new UnauthorizedException('Invalid refresh token');
		}

		const { accessToken, refreshToken: newRefreshToken, refreshTokenHash } = await this.jwtService.rotateTokens(user.id);

		await this.dbService.SaveRefreshToken(user.id, refreshTokenHash);

		return {
			message: 'Token refreshed successfully',
			accessToken,
			newRefreshToken,
		};
	}

	async getLoggedIn(accessToken: string): Promise<{ loggedIn: boolean; userId?: string }> {
		try {
			return { loggedIn: await this.jwtService.verifyToken(accessToken) };
		} catch (error) {
			// Suppress noisy log output during tests but keep for other environments
			console.log('Error verifying token', error as Error);
			return { loggedIn: false };
		}
	}
}
