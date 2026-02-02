import {
	Injectable,
	InternalServerErrorException,
	UnauthorizedException,
} from '@nestjs/common';

import { DbService } from '../db/db.service';
import { JwtService } from '../jwt/jwt.service';

import { LoginUserDto } from 'src/dto/loginUser.dto';
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
	async login(loginUserDto: LoginUserDto): Promise<{ message: string; userID: string; accessToken: string; refreshToken: string; }> {
		const user: User | null = await this.dbService.findOne(undefined, loginUserDto.username);

		if(!user) return this.register(loginUserDto);
		
		const tokens = await this.jwtService.rotateTokens(user.id);
		await this.dbService.saveRefreshToken(user, tokens.refreshTokenHash);

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
	async register(loginUserDto: LoginUserDto): Promise<{ message: string; userID: string; accessToken: string; refreshToken: string; }> {
		const userPayload: Partial<User> = {
				username: loginUserDto.username,
		};

		const user = await this.dbService.create(userPayload);
		if (!user || !user.id) return Promise.reject(new InternalServerErrorException('Error creating new user'));
		const { accessToken, refreshToken, refreshTokenHash } = await this.jwtService.rotateTokens(user.id);
		await this.dbService.saveRefreshToken(user, refreshTokenHash);

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
		// Verify and decode the refresh token
		let payload;
		try {
			payload = await this.jwtService.verifyAndDecode(refreshToken);
		} catch (error) {
			throw new UnauthorizedException('Invalid refresh token');
		}

		const user = await this.dbService.findOne(payload.sub);
		
		if (!user?.id || !user.refreshTokenHash) {
			throw new UnauthorizedException('User not found or refresh token not set');
		}

		// Verify the refresh token matches what we have stored
		const isValidToken = await this.jwtService.compareToken(refreshToken, user.refreshTokenHash);
		if (!isValidToken) {
			throw new UnauthorizedException('Invalid refresh token');
		}

		// Generate and save new tokens
		const { accessToken, refreshToken: newRefreshToken, refreshTokenHash } = 
			await this.jwtService.rotateTokens(user.id);
		await this.dbService.saveRefreshToken(user, refreshTokenHash);

		return {
			message: 'Token refreshed successfully',
			accessToken,
			newRefreshToken,
		};
	}

	async getLoggedIn(accessToken: string): Promise<{ loggedIn: boolean; userId?: string }> {
		return { loggedIn: await this.jwtService.verifyToken(accessToken) };
	}
}
