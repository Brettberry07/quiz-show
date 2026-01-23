# QuizSink

## Project overview

QuizSink is a real-time classroom quiz game with a NestJS backend and a Next.js frontend. The backend is server-authoritative, handles auth/quiz REST APIs plus game state, and communicates with clients over WebSockets. The frontend provides the host/player experiences and consumes the REST and socket endpoints.

## Tech Stack

Frontend: Next.js
Backend: NestJS
Database: SQLite
Realtime: WebSockets

## Key docs

- Backend REST endpoints: `backend/API.md`
- Backend system design + architecture: `backend/BackendDoc.md`
- Frontend Architecture: `frontend/FrontendDoc.md`

## Getting Started

1. Clone the repo
2. Install dependencies in frontend and backend folders
3. Run the dev servers
4. Open the app in your browser

Detailed setup lives in docs/onboarding.md

## How We Work

We use GitHub Issues to track work  
Branch out from the respective branch before making changes
Every change goes through Pull Requests  
Maintainers review before merge
**YOU CANNOT MERGE PR'S YOURSELF**  

> [!NOTE]
> Read `./CONTRIBUTING.md` before your first change

## Need Help

1. Post questions in GitHub Issues with the `help wanted` tag
2. Ask Cameron, Brett or Chloe during class
3. Email `gintherc@bentonvillek12.org` or `berrybr@bentonvillek12.org`
