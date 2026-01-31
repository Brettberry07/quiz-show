# Full API Reference

The sections below enumerate all HTTP routes implemented by the server, their HTTP method, expected inputs, purpose, and authorization requirements.

**Notes:**

- Routes protected with JWT authentication require header `Authorization: Bearer <access_token>`.
- `BodyRequiredGuard` enforces that a JSON body exists for endpoints annotated with it.

--

## Auth / Root

- `GET /` (Public)
  - Purpose: Basic health check and API root information.
  - Inputs: none
  - Response: `{ message, status, version }`

- `POST /login` (Public, Body required)
  - Purpose: Authenticate a user. If user doesn't exist, a user is created automatically.
  - Body: `LoginUserDto` e.g. `{ "username": "cam", "password": "..." }` (password may be optional depending on DTO)
  - Returns: `{ access_token, refresh_token, token_type, user_id, message }`
  - Notes: `BodyRequiredGuard` is used to ensure a request body is present.

- `PATCH /auth/refresh` (Public, Body required)
  - Purpose: Exchange a refresh token for a new access token and refresh token.
  - Body: `RefreshUserTokensDto` e.g. `{ "refresh_token": "<refresh-token>" }`
  - Returns: `{ access_token, refresh_token, token_type, message }`

- `GET /auth/me` (Authenticated)
  - Purpose: Return current authenticated user's basic info.
  - Inputs: JWT bearer token in `Authorization` header
  - Returns: `{ message, status, data: { id, username, role } }`

--

## Users

All `users` routes require a valid JWT (`JwtAuthGuard` is applied to the controller).

- `GET /users` (Authenticated)
  - Purpose: List all users (summary fields only)
  - Inputs: JWT
  - Returns: `{ message, data: [{ id, username, createdAt }, ...] }`
  - Errors: `404` if no users found.

- `GET /users/me` (Authenticated)
  - Purpose: Retrieve the current user's own profile
  - Inputs: JWT
  - Returns: `{ message, data: { id, username, createdAt } }`

- `DELETE /users/:uuid` (Authenticated)
  - Purpose: Delete a user by UUID (requires authentication; controller-level guard applies)
  - Path params: `uuid` — user id to delete
  - Returns: `{ message, data: { id, username } }` or `404` if not found

--

## Quiz

All `quiz` routes require JWT authentication.

- `POST /quiz` (Authenticated)
  - Purpose: Create a new quiz
  - Body: `CreateQuizDto` — fields include `title`, `questions[]` (objects with `text`, `type`, `timeLimitSeconds`, `pointsMultiplier`, `options[]`, `correctOptionIndex`, etc.)
  - Returns: `{ message, data: <quiz summary> }`

- `GET /quiz` (Authenticated)
  - Purpose: List quizzes (paginated)
  - Query params: `page` (number), `limit` (number)
  - Returns: `{ message, page, limit, data: [...] }` (service returns paginated result)

- `GET /quiz/my` (Authenticated)
  - Purpose: Returns quizzes owned by the current user
  - Inputs: JWT
  - Returns: `{ message, data: [<quiz summaries>] }`

- `GET /quiz/stats` (Authenticated)
  - Purpose: Aggregate statistics for quizzes
  - Returns: `{ message, data: { ...stats } }`

- `GET /quiz/:id/validate` (Authenticated)
  - Purpose: Validate whether the quiz with id `:id` is valid to start a game
  - Path params: `id` — quiz id
  - Returns: `{ message, data: { valid: boolean, errors?: [...] } }`

- `GET /quiz/:id` (Authenticated)
  - Purpose: Get full quiz details. If requester is the host, correct answers may be included; otherwise answers are hidden.
  - Path params: `id` — quiz id
  - Returns: `{ message, data: <quiz object> }`

- `PATCH /quiz/:id` (Authenticated)
  - Purpose: Update a quiz
  - Path params: `id` — quiz id
  - Body: `UpdateQuizDto` — fields to update
  - Returns: `{ message, data: <updated quiz summary> }`

- `POST /quiz/:id/questions` (Authenticated)
  - Purpose: Add a question to an existing quiz
  - Path params: `id` — quiz id
  - Body: `AddQuestionDto` (question fields similar to those used at quiz creation)
  - Returns: `{ message, data: <safe question object> }`

- `POST /quiz/game/:pin/questions` (Authenticated)
  - Purpose: Players in a game's lobby can contribute one question before the game starts. The server validates eligibility and adds the question to the quiz.
  - Path params: `pin` — game PIN
  - Body: `AddQuestionDto`
  - Returns: `{ message, data: <safe question object> }`

- `DELETE /quiz/:id/questions/:questionId` (Authenticated)
  - Purpose: Remove a question from a quiz
  - Path params: `id` — quiz id, `questionId` — question id
  - Returns: `{ message, data: { removed: boolean } }`

- `DELETE /quiz/:id` (Authenticated)
  - Purpose: Delete a quiz owned by the current user
  - Path params: `id` — quiz id
  - Returns: `{ message, data: <deleted quiz summary> }`

--

## Game

All `game` routes require JWT authentication (`JwtAuthGuard` at controller level). Many actions are restricted to the game's host (server checks host by comparing `req.user.id`).

- `POST /game` (Authenticated)
  - Purpose: Create a new game instance for a quiz
  - Body: `CreateGameDto` — `{ quizId: string }`
  - Behavior: Creates a game, assigns host to `req.user.id`, returns game object including `pin` and initial state
  - Returns: `{ message, status: 201, data: <game summary> }`

- `GET /game/:pin` (Authenticated)
  - Purpose: Retrieve game status and summary
  - Path params: `pin` — game PIN
  - Returns: `{ message, status, data: { state, playerCount, currentQuestionIndex, totalQuestions, hostId, quizId, startedAt } }`

- `GET /game/:pin/players` (Authenticated)
  - Purpose: List connected players and their public info
  - Path params: `pin`
  - Returns: `{ message, data: [players...] }`

- `POST /game/:pin/join` (Authenticated)
  - Purpose: Join a player to a game
  - Path params: `pin`
  - Body: `JoinGameDto` e.g. `{ nickname: string, socketId?: string }`
  - Behavior: Adds player (user id from JWT) to game, returns `playerId` and `player` object

- `POST /game/:pin/leave` (Authenticated)
  - Purpose: Remove current user from the game
  - Path params: `pin`
  - Returns: `{ message, status, data: { removed: true } }`

- `POST /game/:pin/reconnect` (Authenticated)
  - Purpose: Update player's socket id when reconnecting
  - Path params: `pin`
  - Body: `ReconnectDto` e.g. `{ socketId: string }`
  - Returns: `{ message, data: { socketId } }`

- `POST /game/:pin/start` (Authenticated, Host only)
  - Purpose: Start the game (host-only). Server verifies host identity via `req.user.id`.
  - Path params: `pin`
  - Returns: `{ message, status, data: { pin, startedAt, currentQuestionIndex } }`

- `GET /game/:pin/question` (Authenticated)
  - Purpose: Retrieve the current question for the game. If requester is host and question is not active, host also receives `correctOptionIndex`.
  - Path params: `pin`
  - Returns: `{ message, status, data: { pin, state, question, timeRemainingMs, currentQuestionIndex, totalQuestions, correctOptionIndex? } }`

- `POST /game/:pin/answer` (Authenticated)
  - Purpose: Submit an answer for the current question
  - Path params: `pin`
  - Body: `SubmitAnswerDto` e.g. `{ answerIndex: number }`
  - Returns: `{ message, status, data: <submission result> }`
  - Errors: `409 Conflict` if answer already submitted

- `POST /game/:pin/question/end` (Authenticated, Host only)
  - Purpose: End the active question early (host-only). Returns the correct answer index and new state.
  - Path params: `pin`
  - Returns: `{ message, status, data: { correctOptionIndex, state } }`

- `POST /game/:pin/leaderboard/show` (Authenticated, Host only)
  - Purpose: Reveal leaderboard to players (host-only)
  - Path params: `pin`
  - Returns: `{ message, status, data: { state } }`

- `GET /game/:pin/leaderboard` (Authenticated)
  - Purpose: Retrieve leaderboard entries
  - Path params: `pin`
  - Query params: `limit` (optional) — number of entries to return
  - Returns: `{ message, status, data: { entries, state, currentQuestionIndex, totalQuestions } }`

- `POST /game/:pin/question/next` (Authenticated, Host only)
  - Purpose: Advance to the next question (host-only)
  - Path params: `pin`
  - Returns: `{ message, status, data: { hasMoreQuestions, state, currentQuestionIndex, totalQuestions } }`

- `POST /game/:pin/end` (Authenticated, Host only)
  - Purpose: End the game and show final leaderboard
  - Path params: `pin`
  - Returns: `{ message, status, data: { state, leaderboard } }`

- `DELETE /game/:pin` (Authenticated, Host only)
  - Purpose: Delete the game instance
  - Path params: `pin`
  - Returns: `{ message, status, data: { deleted: true } }`
