# Frontend System Design: Next.js Quiz Client

This document describes the frontend structure, major user flows, and UX patterns for the QuizShow project. It's written for developer onboarding and mirrors the style and detail of `backend/BackendDoc.md`.

## 1. Overview

Responsibilities

- Render lobby, host dashboard, join screens, live question UI, and leaderboards.
- Maintain ephemeral client state (UI, timers, optimistic updates).
- Connect to backend via REST (for quizzes) and WebSockets (real-time gameplay).
- Provide reusable UI primitives and contexts for cross-app state.

Design goals

- Use Next.js (App Router) for fast routing and server-client boundaries.
- Keep UI components small, reusable, and accessible.
- Keep real-time logic isolated in contexts and hooks; UI consumes those abstractions.

## 2. Tech Stack

- Next.js (App Router) — file-based routes in `/app`.
- React + TypeScript.
- CSS via `globals.css` + PostCSS.
- Client-side state via React Contexts in `/context`.
- WebSocket / Socket.io client (matching backend GameGateway) for real-time events.

## 3. Repo / Frontend Layout (file-by-file)

Below is a concise explanation of each file/folder in `frontend/` and its purpose.

- `env` & config
  - `.env`, `.env.example`: environment variables (API URL, WS URL). Keep secrets out of VCS.
  - `next.config.ts`, `tsconfig.json`, `package.json`, `postcss.config.mjs`, `eslint.config.mjs`: standard Next.js config and build setup.

- `app/` (Next.js App Router pages)
  - `layout.tsx`: App-wide layout — mounts global contexts, header/footer and wraps app UI.
  - `globals.css`: global styles and utility classes.
  - `page.tsx`: Root landing page (marketing / entry point).
  - `create/page.tsx`: UI for creating quizzes (host flows that POST to backend REST endpoints).
  - `home/page.tsx`: Generic home/dashboard for signed-in host or player landing.
  - `host/page.tsx`: Host dashboard / list of host actions.
  - `host/game/page.tsx`: Host view of an active running game (controls like Start, Next, End) and live scoreboard.
  - `host/leaderboard/page.tsx`, `host/review/page.tsx`, `host/winner/page.tsx`: Host-specific views for reviewing results and showing winners.
  - `join/page.tsx`: Player join screen — enter `pin` and `nickname`.
  - `play/page.tsx`: Player gameplay view — shows current question and options.
  - `play/leaderboard/page.tsx`: Player-side leaderboard view.

- `components/`
  - `QuestionBuilder.tsx`: UI used when creating a quiz question — option inputs, time limit, correct answer selection.
  - `SmoothScroll.tsx`: Helper component to animate scrolls between UI sections.
  - `layout/Shell.tsx`: Reusable app shell used by pages for consistent spacing, header, and meta.

- `components/ui/`
  - `Button.tsx`, `Card.tsx`, `Input.tsx`: Small, focused UI primitives used across the app. Keep props simple: `onClick`, `disabled`, `variant`, accessibility attributes.

- `context/`
  - `GameContext.tsx`: Primary real-time context — manages socket connection, event listeners, and provides game state to components.
  - `QuizContext.tsx`: Local client cache for quiz data (questions, edits) used in create/edit flows.
  - `UserContext.tsx`: User/session info (host identity, temporary player token, nicknames).

- `lib/`
  - `utils.ts`: Small helper utilities used across the frontend (formatting, timers, validation helpers).

- `public/`: Static assets (images, icons, fonts) served by Next.js.

- `.next/`, `build/`, `dev/`, `cache/`: Build artifacts — ignore in PRs.

## 4. Important Components & Code Patterns (cross-project)

These files/constructs are the most important to understand when contributing.

- `GameContext.tsx` (critical)
  - Purpose: Owns the socket connection lifecycle and exposes APIs: `connect(pin, role, token)`, `join(pin, nickname)`, `submitAnswer(questionId, answerIndex)`, and state (`gameState`, `playerList`, `currentQuestion`, `timeLeft`).
  - Key responsibilities:
    - Open/close socket and manage reconnection / recovery token.
    - Subscribe to server events like `quiz.question_start`, `quiz.question_end`, `game.leaderboard`, `player.feedback`.
    - Provide a small pub/sub model so UI components can subscribe to granular updates.
  - Best practices: Keep the context pure with minimal UI logic; expose a hook `useGame()` that returns memoized values and action functions.

- `QuizContext.tsx`
  - Purpose: Manage quiz creation/editing flow and local validation before sending to backend.
  - Stores the `draftQuiz` and helper functions to add/remove questions, validate time limits, and upload via REST.

- `QuestionBuilder.tsx`
  - Purpose: Reusable editor for adding/editing questions. Exposes controlled inputs for text, options, time limit, and correct index.
  - Important UX: Inline validation, keyboard shortcuts, drag-to-reorder options (if implemented), and preview mode.

- UI primitives (`Button`, `Card`, `Input`)
  - Keep these small and accessible. Each should accept `aria-*` props, a `className`, and behave predictably under disabled/pressed states.

- `play/page.tsx` and `host/game/page.tsx` (runtime pages)
  - `play/page.tsx` consumes `useGame()` and renders one of: LOBBY, QUESTION, RESULT, LEADERBOARD.
  - Timer handling: UI shows decreasing timer derived from server-sent `endsAt` or `duration` + `endsAt` values. Do not trust client-local timers for scoring — server is authoritative.

## 5. Real-time contract & flow (frontend view)

Mapping of client actions to server events (frontend responsibilities):

- On join screen: call `GameContext.join(pin, nickname)` → socket emits `player.join`.
- When host presses Start: call `GameContext.startGame()` → emit `host.start_game`.
- On question start: server emits `quiz.question_start` with `{ text, options, duration, endsAt }`. Frontend:
  - Display question text and options.
  - Start a client-side visual countdown synced to `endsAt`.
  - Accept the first submit and call `submitAnswer(questionId, answerIndex)`.
- On submit: emit `player.submit_answer` with `{ questionId, answerIndex }` (server timestamps arrival).
- After question end: server emits `quiz.question_end` with correct answer and stats — show results UI.
- Leaderboards: server emits `game.leaderboard` — render top scores.

Notes for developers:

- The frontend must ignore local scoring logic used only for UI transitions — final score displayed is server-provided.
- Use server-sent `endsAt` to compute client timer: `timeLeft = endsAt - Date.now()`.

## 6. User Flows (high level)

1. Host flow (create & run):
   - Create a quiz via `create/page.tsx` (uses `QuestionBuilder` + `QuizContext`).
   - Host dashboard (`host/page.tsx`) shows created quizzes and `Start` actions.
   - On `host/game/page.tsx`: use `GameContext` to control rounds (Start, Next Question, End).
   - Host sees a private channel layout where answers are revealed only after `quiz.question_end`.

2. Player flow (join & play):
   - Visit `join/page.tsx` → enter `PIN` + `nickname` → `GameContext.join()`.
   - Wait in lobby; on `quiz.question_start` UI shows question.
   - Submit an answer before the timer expires; receive `player.feedback` privately and see leaderboard updates.

3. Reconnect flow:
   - On page reload, `UserContext` should attempt to restore a `recoveryToken` (if present) and re-open socket connection with it.
   - `GameContext` maps new socket to existing player session using that token.

## 8. Developer guidelines & conventions

- Keep contexts minimal and testable — most logic should be pure functions in `lib/utils.ts` or local helpers.
- Prefer small presentational components in `components/ui` and keep heavy logic in hooks or contexts.
- Reuse `QuestionBuilder` for both create and edit flows.

## 9. Running & Local Development

```bash
# from frontend/
npm install
npm run dev
# or
pnpm install
pnpm dev
```

---

- Generated using GPT-5 mini through GitHub Copilot
