# Quiz Show

## Project overview
Quiz Show is a real-time classroom quiz game with a NestJS backend and a Next.js frontend. The backend is server-authoritative, handles auth/quiz REST APIs plus game state, and communicates with clients over WebSockets. The frontend provides the host/player experiences and consumes the REST and socket endpoints.

## Key docs
- Backend REST endpoints: `backend/REST-GAME-API.md`
- Backend system design + architecture: `backend/SysDesign.md`
- Frontend/backend integration notes: `frontend/backend-architecture.txt`

## Repo structure
- `backend/src`
  - `app.module.ts`, `main.ts`: NestJS bootstrap
  - `auth`, `jwt`: login/token flows
  - `db`, `entities`: database setup and models
  - `dto`: request/response DTOs
  - `quiz`, `users`: REST modules
  - `game`: game services/state
  - `test`: backend tests
- `frontend`
  - `app`: Next.js routes
  - `components`: shared UI components
  - `context`: React context providers
  - `lib`: shared helpers
  - `public`: static assets

## Run locally
Open two terminals and run the backend and frontend separately.

### Backend
```bash
cd backend
npm install
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Linting and tests
```bash
# backend
cd backend
npm run lint
npm run test

# frontend
cd ../frontend
npm run lint
```

## Pull request guidance
- Branch naming: `feature/<short-summary>`, `fix/<short-summary>`, or `chore/<short-summary>`.
- Summary: 2–4 bullets describing the change and impact.
- Checklist: include a short checklist (tests run, docs updated, screenshots attached).
- Testing: list commands run and results; call out if not run and why.
- Screenshots: required for UI changes (before/after if visual).

## Issue guidance
- Title: concise and specific (component + problem).
- Description: what is happening and where.
- Repro steps: numbered steps that reliably reproduce the issue.
- Expected vs actual: explicitly call out both.
- Logs/console output: paste relevant snippets.
- Screenshots/video: attach when UI or layout is involved.
- Acceptance criteria: checklist of what “done” means.
