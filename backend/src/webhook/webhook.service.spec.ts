import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { WebhookService } from './webhook.service';
import { WebhookEventType } from './webhook.types';

describe('WebhookService', () => {
	let service: WebhookService;
	let httpService: jest.Mocked<HttpService>;

	beforeEach(async () => {
		const mockHttpService = {
			post: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				WebhookService,
				{
					provide: HttpService,
					useValue: mockHttpService,
				},
			],
		}).compile();

		service = module.get<WebhookService>(WebhookService);
		httpService = module.get(HttpService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('Subscription Management', () => {
		it('should register a host subscription', () => {
			const subscription = service.registerSubscription(
				'123456',
				'host',
				'https://example.com/webhook',
				'test-secret-key-1234567890',
			);

			expect(subscription.id).toBeDefined();
			expect(subscription.pin).toBe('123456');
			expect(subscription.clientType).toBe('host');
			expect(subscription.status).toBe('active');
			expect(subscription.consecutiveFailures).toBe(0);
		});

		it('should register a whiteboard subscription', () => {
			const subscription = service.registerSubscription(
				'123456',
				'whiteboard',
				'https://example.com/whiteboard',
				'test-secret-key-1234567890',
			);

			expect(subscription.clientType).toBe('whiteboard');
		});

		it('should register a player subscription', () => {
			const subscription = service.registerPlayerSubscription(
				'123456',
				'player-123',
				'https://example.com/player',
				'test-secret-key-1234567890',
			);

			expect(subscription.clientType).toBe('player');
			expect(subscription.playerId).toBe('player-123');
		});

		it('should replace existing player subscription', () => {
			const first = service.registerPlayerSubscription(
				'123456',
				'player-123',
				'https://example.com/first',
				'secret-1234567890abcdef',
			);

			const second = service.registerPlayerSubscription(
				'123456',
				'player-123',
				'https://example.com/second',
				'secret-1234567890abcdef',
			);

			expect(second.id).not.toBe(first.id);
			expect(() => service.getSubscription(first.id)).toThrow();
		});

		it('should get subscription by id', () => {
			const created = service.registerSubscription(
				'123456',
				'host',
				'https://example.com/webhook',
				'test-secret-key-1234567890',
			);

			const fetched = service.getSubscription(created.id);
			expect(fetched.id).toBe(created.id);
		});

		it('should throw when subscription not found', () => {
			expect(() => service.getSubscription('non-existent-id')).toThrow();
		});

		it('should remove subscription', () => {
			const subscription = service.registerSubscription(
				'123456',
				'host',
				'https://example.com/webhook',
				'test-secret-key-1234567890',
			);

			service.removeSubscription(subscription.id);
			expect(() => service.getSubscription(subscription.id)).toThrow();
		});

		it('should remove all game subscriptions', () => {
			const sub1 = service.registerSubscription('123456', 'host', 'https://a.com', 'secret-1234567890abcdef');
			const sub2 = service.registerSubscription('123456', 'whiteboard', 'https://b.com', 'secret-1234567890abcdef');
			service.registerPlayerSubscription('123456', 'player-1', 'https://c.com', 'secret-1234567890abcdef');

			service.removeGameSubscriptions('123456');

			expect(() => service.getSubscription(sub1.id)).toThrow();
			expect(() => service.getSubscription(sub2.id)).toThrow();
		});
	});

	describe('Event Emission', () => {
		it('should emit event to all game subscriptions', async () => {
			httpService.post.mockReturnValue(
				of({ status: 200, data: {} } as any),
			);

			service.registerSubscription('123456', 'host', 'https://a.com', 'secret-1234567890abcdef');
			service.registerSubscription('123456', 'whiteboard', 'https://b.com', 'secret-1234567890abcdef');

			const results = await service.emit('123456', WebhookEventType.GAME_STATE_CHANGED, {
				previousState: 'LOBBY',
				currentState: 'question_active',
			});

			expect(results).toHaveLength(2);
			expect(results.every(r => r.success)).toBe(true);
			expect(httpService.post).toHaveBeenCalledTimes(2);
		});

		it('should filter by client type', async () => {
			httpService.post.mockReturnValue(
				of({ status: 200, data: {} } as any),
			);

			service.registerSubscription('123456', 'host', 'https://host.com', 'secret-1234567890abcdef');
			service.registerSubscription('123456', 'whiteboard', 'https://wb.com', 'secret-1234567890abcdef');

			const results = await service.emit('123456', WebhookEventType.GAME_JOINED, { playerId: 'p1', nickname: 'Test', playerCount: 1 }, {
				targetClientTypes: ['host'],
			});

			expect(results).toHaveLength(1);
			expect(httpService.post).toHaveBeenCalledTimes(1);
			expect(httpService.post.mock.calls[0][0]).toBe('https://host.com');
		});

		it('should filter by player id', async () => {
			httpService.post.mockReturnValue(
				of({ status: 200, data: {} } as any),
			);

			service.registerPlayerSubscription('123456', 'player-1', 'https://p1.com', 'secret-1234567890abcdef');
			service.registerPlayerSubscription('123456', 'player-2', 'https://p2.com', 'secret-1234567890abcdef');

			const results = await service.emit('123456', WebhookEventType.PLAYER_FEEDBACK, {
				playerId: 'player-1',
				isCorrect: true,
				points: 100,
				combo: 1,
				elapsedMs: 500,
				newTotalScore: 100,
			}, {
				targetPlayerId: 'player-1',
			});

			expect(results).toHaveLength(1);
			expect(httpService.post.mock.calls[0][0]).toBe('https://p1.com');
		});

		it('should return empty results for game with no subscriptions', async () => {
			const results = await service.emit('999999', WebhookEventType.GAME_STATE_CHANGED, {
				previousState: 'LOBBY',
				currentState: 'question_active',
			});

			expect(results).toHaveLength(0);
		});

		it('should handle delivery failures', async () => {
			httpService.post.mockReturnValue(
				throwError(() => new Error('Connection refused')),
			);

			service.registerSubscription('123456', 'host', 'https://a.com', 'secret-1234567890abcdef');

			const results = await service.emit('123456', WebhookEventType.GAME_STATE_CHANGED, {
				previousState: 'LOBBY',
				currentState: 'question_active',
			});

			expect(results).toHaveLength(1);
			expect(results[0].success).toBe(false);
			expect(results[0].error).toBeDefined();
		});
	});

	describe('Statistics', () => {
		it('should return correct stats', () => {
			service.registerSubscription('123456', 'host', 'https://a.com', 'secret-1234567890abcdef');
			service.registerSubscription('123456', 'whiteboard', 'https://b.com', 'secret-1234567890abcdef');
			service.registerSubscription('654321', 'host', 'https://c.com', 'secret-1234567890abcdef');

			const stats = service.getStats();

			expect(stats.totalSubscriptions).toBe(3);
			expect(stats.activeSubscriptions).toBe(3);
			expect(stats.failedSubscriptions).toBe(0);
			expect(stats.gameCount).toBe(2);
		});

		it('should return game subscriptions', () => {
			service.registerSubscription('123456', 'host', 'https://a.com', 'secret-1234567890abcdef');
			service.registerSubscription('123456', 'whiteboard', 'https://b.com', 'secret-1234567890abcdef');
			service.registerSubscription('654321', 'host', 'https://c.com', 'secret-1234567890abcdef');

			const subs = service.getGameSubscriptions('123456');
			expect(subs).toHaveLength(2);
		});
	});

	describe('Security', () => {
		it('should include HMAC signature in delivery headers', async () => {
			httpService.post.mockReturnValue(
				of({ status: 200, data: {} } as any),
			);

			service.registerSubscription('123456', 'host', 'https://a.com', 'my-secret-key-1234567890');

			await service.emit('123456', WebhookEventType.GAME_STATE_CHANGED, {
				previousState: 'LOBBY',
				currentState: 'question_active',
			});

			const callArgs = httpService.post.mock.calls[0];
			const headers = callArgs[2]?.headers;

			expect(headers).toBeDefined();
			expect(headers['X-Webhook-Id']).toBeDefined();
			expect(headers['X-Webhook-Timestamp']).toBeDefined();
			expect(headers['X-Webhook-Signature']).toBeDefined();
			expect(headers['Content-Type']).toBe('application/json');
		});
	});
});
