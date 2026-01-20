# LLM Usage

This document outlines the usage of LLM's throught the development of this quiz-show platform. 

## Initial prompt
You are a senior full-stack engineer and systems architect. Your task is to design a real-time classroom quiz game similar to Kahoot, built specifically with the following technology stack.

Required stack

* Frontend: Next.js (web only, no mobile app)
* Backend: NestJS
* Realtime transport: WebSockets
* Storage: NoSQL database
* Deployment target: Cloud hosted MVP

Context
Students join from their laptop browsers with no installation. A shared classroom display shows the current question, live answer distribution, and an always updating leaderboard. The experience must feel fast, fair, and difficult to exploit.

Hard constraints

1. Entirely browser based
2. Scoring depends on correctness and response speed
3. Combo system where consecutive correct answers increase point multipliers
4. Leaderboard updates after every question
5. Must prioritize real time synchronization, anti cheat protections, and fair handling of network latency
6. Must be feasible for a real MVP that could actually be built

Your task
Produce a single, complete system design document in Markdown. This document must be implementation oriented, not theoretical.

The document must include the following sections.

1. Overview
   Product goals, user roles, and architectural summary.

2. Functional requirements
   Clear feature list for student client, host controls, and public display.

3. Non functional requirements
   Latency targets, performance expectations, scalability, reliability, and security.

4. Architecture
   Concrete architecture using Next.js, NestJS, WebSockets, and NoSQL. Include request flows and event flows.

5. Component responsibilities
   What each layer must do:

* Next.js frontend
* WebSocket gateway
* NestJS services
* Database layer

6. Realtime design
   Detailed explanation of WebSocket event types, state synchronization strategy, room handling, and message flow.

7. Data models
   Define NoSQL document schemas for sessions, players, questions, answers, scores, and leaderboards.

8. Scoring system
   Explain exactly how speed scoring, combo multipliers, and fairness adjustments work.

9. Anti cheat and fairness mechanisms
   Concrete techniques such as timing normalization, server authoritative scoring, replay protection, late packet handling, tab switching detection, and multi session blocking.

10. MVP scope
    What is included in version one, what is explicitly deferred, and why.

11. API and event contract
    List WebSocket events with payload examples. Show how frontend and backend communicate.

If you want, I can also generate a second version that forces Gemini to output **actual starter code** for NestJS WebSocket gateway and Next.js client hooks.
