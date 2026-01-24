import { Controller, Get, Param, Delete, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest {
	user: {
		id: string;
		email: string;
		username: string;
		role: string;
	}
}

@Controller('users')
@UseGuards(JwtAuthGuard) // All user endpoints require authentication
export class UsersController {
	constructor(private readonly usersService: DbService) {}

	@Get()
	async findAll() {
		const users = await this.usersService.findAll();
		if (!users.length) {
			throw new NotFoundException('No users found');
		}
		return {
			message: 'Users retrieved successfully',
			data: users.map((user) => ({
				id: user.id,
				username: user.username,
				createdAt: user.createdAt,
			})),
		};
	}

	@Get('me')
	async findOne(@Request() req: AuthenticatedRequest) {
		const user = await this.usersService.findOne(req.user.id);
		if (!user) {
			throw new NotFoundException('User not found');
		}

		return {
			message: 'User retrieved successfully',
			data: {
				id: user.id,
				username: user.username,
				createdAt: user.createdAt,
			},
		};
	}

	@Delete(':uuid')
	async deleteUser(@Param('uuid') uuid: string) {
		const user = await this.usersService.remove(uuid);
		if (!user) {
			throw new NotFoundException('User not found');
		}
		return {
			message: 'User deleted successfully',
			data: {
				id: user.id,
				username: user.username,
			},
		};
	}
}
