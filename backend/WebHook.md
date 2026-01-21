# Webhook Module Plan

## Purpose

Provide low-latency, server-authoritative event delivery to clients (host, players, whiteboard) without Redis. Webhooks deliver state deltas and snapshots directly from the same in-memory source of truth used by the Game and Quiz modules.

## Current System Findings

- Game state is in-memory and authoritative in `GameService` and `Game`.
- Quiz content is in-memory in `QuizService` and converted to `CachedQuiz` for gameplay.
- State transitions and scoring are centralized in the Game module, making it the correct single source for emitting webhook events.

## Responsibilities

1. Register and manage webhook subscriptions by game PIN and client type.
2. Validate webhook targets and secure payloads with HMAC signatures.
3. Emit event payloads on state changes and player actions.
4. Retry failed deliveries with short timeouts and backoff.

## Module Layout

- `src/webhook/webhook.module.ts`
- `src/webhook/webhook.service.ts`
- `src/webhook/webhook.controller.ts`
- `src/webhook/webhook.types.ts`
- `src/webhook/dto/*`

## Subscription Model (In-Memory)

Keyed by `pin` with sub-collections for `clientType` and optional `playerId`.

Fields:

- `id: string`
- `pin: string`
- `clientType: 'host' | 'player' | 'whiteboard'`
- `playerId?: string`
- `targetUrl: string`
- `secret: string`
- `createdAt: Date`
- `lastSeenAt?: Date`
- `status: 'active' | 'failed' | 'disabled'`

## Registration Endpoints

- `POST /webhooks/register` (host + whiteboard)
- `POST /webhooks/register/player` (player scoped)
- `GET /webhooks/:id` (host only)
- `DELETE /webhooks/:id`

Auth:

- Use `JwtAuthGuard` for host and player registration.
- For player registration, accept recovery token or playerId and validate against `GameService`.

## Event Contract

Payloads mirror SysDesign.md events and use safe data where required.

Events:

- `game.joined`
- `game.state_changed`
- `quiz.question_start`
- `quiz.question_end`
- `player.feedback`
- `game.leaderboard`

## Emission Points (Game Module)

Trigger `WebhookService` on:

- `createGame`
- `startGame`
- `submitAnswer`
- `endCurrentQuestion`
- `showLeaderboard`
- `nextQuestion`
- `endGame`

## Payload Security

- `X-Webhook-Id`: UUID
- `X-Webhook-Timestamp`: ISO string
- `X-Webhook-Signature`: HMAC SHA256 over raw JSON payload

## Delivery Strategy

- HTTP POST via Nest `HttpService`.
- Timeout: 1500–2500ms.
- Retries: 2–3 with exponential backoff.
- Mark subscription `failed` after final retry.

## Whiteboard Optimization

- Whiteboard gets richer payloads (e.g., leaderboard + answer distribution snapshots).
- Whiteboard subscriptions are per PIN, not per player.

## Implementation Notes

- No Redis dependency. Use in-memory subscription maps like `GameService` and `QuizService`.
- Keep event payloads small; send deltas rather than full state where possible.
- Prefer safe question payloads (omit correct answers until `quiz.question_end`).
