# Frontend Documentation

This document outlines the frontend architecture for the QuizSink application.

## 1. Overview
The frontend is built with **Next.js (App Router)** and designed to provide a responsive, real-time experience for both hosts and players.

## 2. Key Components
- **Host Dashboard**: Manages game creation, question flow, and leaderboard display.
- **Player Interface**: Handles nickname selection, game joining, and real-time answer submission.
- **WebSocket Client**: Uses `socket.io-client` to maintain a persistent connection with the backend for real-time updates.

## 3. Environment Variables
The following environment variable is critical for the frontend:
- `NEXT_PUBLIC_API_BASE_URL`: The full URL of the backend API (e.g., `http://localhost:5200`). This is used for both REST API calls and WebSocket initialization.

## 4. Docker Integration
The frontend is containerized using a multi-stage Dockerfile:
- **Build Stage**: Installs dependencies and runs `next build`.
- **Production Stage**: Next.js is configured for a standalone build, optimized for production performance and minimal image size.
- **Port**: Listens on port `8080` by default.

## 5. Development Mode
During development, the frontend can be run locally or via Docker Compose:
```bash
# Local
npm install
npm run dev

# Docker Compose (Standard)
docker compose up --build
```
