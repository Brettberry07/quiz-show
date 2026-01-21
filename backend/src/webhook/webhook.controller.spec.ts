import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { GameService } from '../game/game.service';
import { JwtService } from '../jwt/jwt.service';
import { DbService } from '../db/db.service';
import { Game } from '../game/game.class';

describe('WebhookController', () => {
	let controller: WebhookController;
	let webhookService: jest.Mocked<WebhookService>;
	let gameService: jest.Mocked<GameService>;

	const mockUser = { id: 'user-123', username: 'testuser' };
	const mockRequest = { user: mockUser };

	beforeEach(async () => {
		const mockWebhookService = {
			registerSubscription: jest.fn(),
			registerPlayerSubscription: jest.fn(),
			getSubscription: jest.fn(),
			removeSubscription: jest.fn(),
			getGameSubscriptions: jest.fn(),
			getStats: jest.fn(),
		};

		const mockGameService = {
			getGame: jest.fn(),
		};

		const mockJwtService = {
			verifyToken: jest.fn(),
			decodeToken: jest.fn(),
		};

		const mockDbService = {
			getUser: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [WebhookController],
			providers: [
				{ provide: WebhookService, useValue: mockWebhookService },
				{ provide: GameService, useValue: mockGameService },
				{ provide: JwtService, useValue: mockJwtService },
				{ provide: DbService, useValue: mockDbService },
			],
		}).compile();

		controller = module.get<WebhookController>(WebhookController);
		webhookService = module.get(WebhookService);
		gameService = module.get(GameService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('registerWebhook', () => {
		it('should register webhook for host', () => {
			const mockGame = { hostUserId: 'user-123' } as Game;
			const mockSubscription = {
				id: 'sub-1',
				pin: '123456',
				clientType: 'host' as const,
				targetUrl: 'https://example.com',
				status: 'active',
				createdAt: new Date(),
				consecutiveFailures: 0,
				secret: 'secret',
			};

			gameService.getGame.mockReturnValue(mockGame);
			webhookService.registerSubscription.mockReturnValue(mockSubscription);

			const result = controller.registerWebhook(
				{
					pin: '123456',
					clientType: 'host',
					targetUrl: 'https://example.com',
					secret: 'secret-key-1234567890',
				},
				mockRequest,
			);

			expect(result.id).toBe('sub-1');
			expect(result.status).toBe('active');
		});

		it('should reject non-host registration', () => {
			const mockGame = { hostUserId: 'other-user' } as Game;
			gameService.getGame.mockReturnValue(mockGame);

			expect(() =>
				controller.registerWebhook(
					{
						pin: '123456',
						clientType: 'host',
						targetUrl: 'https://example.com',
						secret: 'secret-key-1234567890',
					},
					mockRequest,
				),
			).toThrow(ForbiddenException);
		});
	});

	describe('registerPlayerWebhook', () => {
		it('should register webhook for player in game', () => {
			const mockGame = {
				getPlayer: jest.fn().mockReturnValue({ id: 'user-123', nickname: 'Test' }),
			} as unknown as Game;
			const mockSubscription = {
				id: 'sub-1',
				pin: '123456',
				clientType: 'player' as const,
				playerId: 'user-123',
				targetUrl: 'https://example.com',
				status: 'active',
				createdAt: new Date(),
				consecutiveFailures: 0,
				secret: 'secret',
			};

			gameService.getGame.mockReturnValue(mockGame);
			webhookService.registerPlayerSubscription.mockReturnValue(mockSubscription);

			const result = controller.registerPlayerWebhook(
				{
					pin: '123456',
					targetUrl: 'https://example.com',
					secret: 'secret-key-1234567890',
				},
				mockRequest,
			);

			expect(result.id).toBe('sub-1');
			expect(result.playerId).toBe('user-123');
		});

		it('should reject player not in game', () => {
			const mockGame = {
				getPlayer: jest.fn().mockReturnValue(undefined),
			} as unknown as Game;

			gameService.getGame.mockReturnValue(mockGame);

			expect(() =>
				controller.registerPlayerWebhook(
					{
						pin: '123456',
						targetUrl: 'https://example.com',
						secret: 'secret-key-1234567890',
					},
					mockRequest,
				),
			).toThrow(BadRequestException);
		});
	});

	describe('getWebhook', () => {
		it('should return webhook details for host', () => {
			const mockSubscription = {
				id: 'sub-1',
				pin: '123456',
				clientType: 'host' as const,
				targetUrl: 'https://example.com',
				status: 'active',
				createdAt: new Date(),
				consecutiveFailures: 0,
				secret: 'secret',
			};
			const mockGame = { hostUserId: 'user-123' } as Game;

			webhookService.getSubscription.mockReturnValue(mockSubscription);
			gameService.getGame.mockReturnValue(mockGame);

			const result = controller.getWebhook('sub-1', mockRequest);
			expect(result.id).toBe('sub-1');
		});

		it('should reject non-host access', () => {
			const mockSubscription = {
				id: 'sub-1',
				pin: '123456',
				clientType: 'host' as const,
				targetUrl: 'https://example.com',
				status: 'active',
				createdAt: new Date(),
				consecutiveFailures: 0,
				secret: 'secret',
			};
			const mockGame = { hostUserId: 'other-user' } as Game;

			webhookService.getSubscription.mockReturnValue(mockSubscription);
			gameService.getGame.mockReturnValue(mockGame);

			expect(() => controller.getWebhook('sub-1', mockRequest)).toThrow(ForbiddenException);
		});
	});

	describe('deleteWebhook', () => {
		it('should allow host to delete any webhook', () => {
			const mockSubscription = {
				id: 'sub-1',
				pin: '123456',
				clientType: 'player' as const,
				playerId: 'other-player',
				targetUrl: 'https://example.com',
				status: 'active',
				createdAt: new Date(),
				consecutiveFailures: 0,
				secret: 'secret',
			};
			const mockGame = { hostUserId: 'user-123' } as Game;

			webhookService.getSubscription.mockReturnValue(mockSubscription);
			gameService.getGame.mockReturnValue(mockGame);

			const result = controller.deleteWebhook('sub-1', mockRequest);
			expect(result.success).toBe(true);
			expect(webhookService.removeSubscription).toHaveBeenCalledWith('sub-1');
		});

		it('should allow player to delete their own webhook', () => {
			const mockSubscription = {
				id: 'sub-1',
				pin: '123456',
				clientType: 'player' as const,
				playerId: 'user-123',
				targetUrl: 'https://example.com',
				status: 'active',
				createdAt: new Date(),
				consecutiveFailures: 0,
				secret: 'secret',
			};
			const mockGame = { hostUserId: 'other-host' } as Game;

			webhookService.getSubscription.mockReturnValue(mockSubscription);
			gameService.getGame.mockReturnValue(mockGame);

			const result = controller.deleteWebhook('sub-1', mockRequest);
			expect(result.success).toBe(true);
		});

		it('should reject unauthorized deletion', () => {
			const mockSubscription = {
				id: 'sub-1',
				pin: '123456',
				clientType: 'player' as const,
				playerId: 'other-player',
				targetUrl: 'https://example.com',
				status: 'active',
				createdAt: new Date(),
				consecutiveFailures: 0,
				secret: 'secret',
			};
			const mockGame = { hostUserId: 'other-host' } as Game;

			webhookService.getSubscription.mockReturnValue(mockSubscription);
			gameService.getGame.mockReturnValue(mockGame);

			expect(() => controller.deleteWebhook('sub-1', mockRequest)).toThrow(ForbiddenException);
		});
	});

	describe('getStats', () => {
		it('should return webhook stats', () => {
			const mockStats = {
				totalSubscriptions: 10,
				activeSubscriptions: 8,
				failedSubscriptions: 2,
				gameCount: 3,
			};

			webhookService.getStats.mockReturnValue(mockStats);

			const result = controller.getStats();
			expect(result).toEqual(mockStats);
		});
	});
});
