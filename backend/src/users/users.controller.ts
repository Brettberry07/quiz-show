import { Controller, Get, Param, Delete, UseGuards, Request } from '@nestjs/common';
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
			return { message: 'No users found', status: 404 };
		}
		return {
			message: 'Users retrieved successfully',
			status: 200,
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
			return { message: 'User not found', status: 404, data: undefined };
		}

		return {
			message: 'User retrieved successfully',
			status: 200,
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
			return { message: 'User not found', status: 404, data: undefined };
		}
		return {
			message: 'User deleted successfully',
			status: 200,
			data: {
				id: user.id,
				username: user.username,
			},
		};
	}
}
