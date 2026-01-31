# Backend System Design: Real-Time Classroom Quiz Game

This document outlines the backend architecture for a real-time classroom quiz application. It is designed for **NestJS**, using **WebSockets (Socket.io)** for communication and **SQLite3** for persistence.

The architecture follows a **Server-Authoritative** model. The server holds the "Truth" of the game state, controls the clock, and calculates scores. Clients are "dumb" terminals that display state and send inputs.

---

## 1. Backend Overview

### Responsibilities

1. **State Management**: Maintaining the finite state machine (Lobby -> Question -> Result -> Leaderboard) for multiple concurrent game sessions.
2. **Real-time Broadcasting**: Pushing state updates to host and player clients with sub-100ms latency targets.
3. **Traffic Control**: Validating inputs, suppressing spam, and managing connection lifecycles.
4. **Data Persistence**: Storing quizzes and users in SQLite.

### Trust Boundaries

* **Trusted**: The NestJS Server and the SQLite Database.
* **Untrusted**: Nothing from the client is trusted. Timestamps sent by clients are ignored. Score calculations happen 100% on the server.

### Architectural Goals

* **Monolithic Modular**: A single NestJS instance containing all logic. Easiest to deploy and debug for MVP.
* **In-Memory Hot State**: Active game data lives in the Node.js heap (RAM) for raw speed. SQLite is only for "at rest" data (Quizzes, Question Banks).
* **Event-Driven**: Logic is triggered by WebSocket events or internal server timers (Cron/Timeout).

---

## 2. Core Services and Modules

The application will be structured into the following NestJS modules:

| Module | Responsibility |
| :--- | :--- |
| **`AppModule`** | Root module, config (env vars), and database connection bootstrapper. |
| **`AuthModule`** | Handles Host login via username (issues JWT) and ephemeral Player "login" (Nickname assignment). |
| **`QuizModule`** | **REST Controllers** for creating, editing, and listing Quizzes. Interacts with SQLite. Uses optimized transaction-based updates to avoid N+1 queries. |
| **`GameModule`** | The core engine. Contains the `GameManager` service which holds active games in memory. |
| **`WebSocketModule`** | Contains the `GameGateway`. Handles socket connections, room management, and DTO validation. |
| **`ScoringModule`** | Pure logic service. Calculates points based on time deltas and streaks. |

---

## 3. WebSocket Architecture

We will use `@nestjs/platform-socket.io` with the standardized Socket.io protocol.

### Room Structure

Socket.io "Rooms" are used to isolate game traffic.

1. **`game_lobby_{PIN}`**: All sockets (Host + Players) join this room. Used for broadcast events like `question_start`.
2. **`host_{PIN}`**: Only the Host socket joins. Used for sending sensitive data (correct answers *before* reveal) or admin confirmations.
3. **`player_{SOCKET_ID}`**: Private channel for individual feedback ("You got it right!", "Combo x2").

### Connection Lifecycle

1. **Connect**: Client establishes WS connection.
2. **Identity Handshake**:
    * **Host**: Sends JWT (obtained from username-only login) in handshake auth. Recover session if valid.
    * **Player**: Sends `gamePin` and `nickname`.
3. **Join**: Server validates PIN. If open, adds socket to `game_lobby_{PIN}`. Returns `playerId` and `recoveryToken`.
4. **Reconnection**: If a client drops and returns within 30 seconds, they send the `recoveryToken`. The server maps the new `SocketID` to the existing in-memory `Player` object.

### State Synchronization

We do not sync the *entire* state on every tick. We send **deltas** based on events.

* *On Join*: Send full current state (LOBBY or ACTIVE_QUESTION).
* *On Timer*: Server sends `TICK` periodically (e.g., every 1s) simply to keep client clocks visually synced, but the server holds the master timeout.

---

## 4. Event Contract

### Client -> Server (Events emitted by Next.js)

| Event Name | Payload Schema | Description |
| :--- | :--- | :--- |
| `player.join` | `{ pin: string, nickname: string }` | Request to enter a lobby. |
| `host.start_game` | `{ pin: string }` | Triggers the transition from LOBBY to QUESTION 1. |
| `player.submit_answer` | `{ questionId: string, answerIndex: number }` | **CRITICAL**. Timestamped on arrival by server. |
| `host.next_question` | `{ pin: string }` | Move from stats/leaderboard to next Q. |
| `game.recovery` | `{ token: string }` | Attempt to reclaim a disconnected session. |

### Server -> Client (Events received by Next.js)

| Event Name | Payload Schema | Description |
| :--- | :--- | :--- |
| `game.joined` | `{ playerId: string, token: string, state: GameState }` | Confirmation of entry. |
| `game.player_list` | `{ players: String[] }` | Update waiting room list. |
| `quiz.question_start` | `{ text: string, options: string[], duration: number, endsAt: number }` | **NOTE**: Does not contain the correct answer ID. |
| `quiz.question_end` | `{ correctAnswerIndex: number, distributions: number[] }` | Reveals the truth and global stats. |
| `player.feedback` | `{ correct: boolean, score: number, combo: number, rank: number }` | Private message to specific player socket. |
| `game.leaderboard` | `{ top5: { nick: string, score: number }[] }` | Sent to Host/Main screen. |

---

## 5. Data Models

### Persistent Schema (SQLite / TypeORM Entities)

These store the static content.

```typescript
// @Entity() - stored in SQLite
class Quiz {
  id: string; // UUID
  title: string;
  hostId: string; // Relation to User
  questions: Question[]; 
}

class Question {
  id: string;
  quizId: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  timeLimitSeconds: number;
  pointsMultiplier: number; // For "Double Points" rounds
  options: string[]; // JSON stored in DB: ["Red", "Blue", "Green", "Yellow"]
  correctOptionIndex: number; 
}
```

### Ephemeral Schema (In-Memory Game State)

These live in the `GameManager` Service. They are optimized for read/write speed.

```typescript
// Living in a Map<string, ActiveGame>
interface ActiveGame {
  pin: string;
  quizData: Quiz; // Cached copy of the quiz
  currentQuestionIndex: number;
  state: 'LOBBY' | 'question_active' | 'processing' | 'leaderboard' | 'ended';
  
  // High-precision server time when the current Question opened
  questionStartTime: number; 
  
  players: Map<string, PlayerState>; // Keyed by PlayerID
  hostSocketId: string;
}

interface PlayerState {
  id: string; 
  socketId: string; // Updates on reconnect
  nickname: string;
  totalScore: number;
  currentCombo: number; // Consecutive correct answers
  
  // Reset every question
  lastAnswer: {
     answerIndex: number;
     submissionTime: number; // Server HRTime
  } | null;
}
```

---

## 6. Game State Management & The Loop

The `GameManager` handles the state machine.

1. **Timer Management**:
    * We use `setTimeout` on the server for the official question end.
    * **Grace Period**: The server accepts answers for `timeLimit + 500ms` (configurable) to account for network jitter, but penalizes the score based on arrival time.
2. **Concurrency**:
    * JavaScript is single-threaded (Event Loop). This is an advantage here.
    * There are no race conditions when updating the score of a specific player because the event handler for that player runs synchronously.
3. **Crash Recovery**:
    * *MVP Decision*: If the server process restarts (crash/deploy), **active games are lost**. This is acceptable for an MVP.
    * State is not written to SQLite during the game to avoid disk I/O latency.

---

## 7. Scoring and Fairness Logic

The system must reward speed but prioritize correctness.

### The Algorithm

```typescript
calculateScore(
  timeLimit: number, // e.g., 20 seconds
  elapsed: number,   // e.g., 5.4 seconds
  isCorrect: boolean,
  combo: number,
  basePoints: number = 1000
): number {
  if (!isCorrect) return 0;

  // Linear decay. Answer immediately = 1000pts. Answer at 0s left = 500pts.
  // We guarantee at least half points for a correct answer no matter how slow.
  const timeRatio = 1 - (elapsed / timeLimit / 2); 
  
  // Round to nearest 10
  const rawScore = Math.round(basePoints * timeRatio);
  
  // Combo multiplier: Standard 1.0, +0.1 per streak, capped at 1.5x
  const multiplier = Math.min(1 + (combo * 0.1), 1.5);
  
  return Math.floor(rawScore * multiplier);
}
```

### Latency Normalization

We cannot trust the client's "Sent At" timestamp (easily spoofed).

1. Server records `T_Start` (process.hrtime).
2. Payload arrives at Server at `T_Arrival`.
3. `Elapsed = T_Arrival - T_Start`.
4. If `Elapsed < 0`, someone is hacking or clock drift -> Clamp to 0.
5. If `Elapsed > TimeLimit`, reject (with the 500ms grace period exception).

---

## 8. Anti-Cheat Protections

1. **Blind Payloads**: The `question_start` event payload **MUST NOT** include the `correctOptionIndex`. Cheat bots analyzing network traffic will see the question text, but not the answer. The answer is only sent in `question_end`.
2. **Throttling**: The server accepts only the **first** answer from a `playerId` for a given `questionId`. Subsequent requests are ignored. Prevents "spray and pray" scripts.
3. **State Gating**: An `AnswerInterceptor` middleware will check `game.state`. If the game is in `LEADERBOARD` mode, any `submit_answer` events are thrown out immediately.
4. **HTML Sanctity**: Answers are submitted as Integers (Index), not Strings. This prevents injection attacks if the answer text is rendered unsanitized on the host screen.
5. **Replay Protection**: Since we map socket IDs to internal Player IDs via a token, a user cannot open 5 tabs and control the same player to increase odds. One socket = one connection logic.

---

## 9. Persistence Strategy

### SQLite (File-based)

* **Users**: Username only (trusted environment, no password required).
* **Quizzes**: JSON blob for options structure to keep schema simple.
* **QuizHistory**: (Optional for MVP) Stores who won past games.

### In-Memory (Heap)

* **ActiveGames**: The entire state of currently running quizzes.
* **SocketMappings**: `SocketID` -> `PlayerID` lookup table.

**Why?** SQLite is not designed for the high-frequency writes required to update scores for 50 players every second. Memory is instant.

---

## 10. MVP Scope

### Included (Version 1.0)

* Host ability to create/edit quizzes via API.
* Host Dashboard (Start game, Next, End).
* Player Join via PIN.
* Single Answer Multiple Choice questions.
* Standard Scoring (Speed + Correctness).
* Reconnecting (surviving a page refresh).

### Excluded (Post-MVP)

* Team Mode.
* Free text input questions (requires manual grading or fuzzy matching).
* Rich media (Images/Video in questions).
