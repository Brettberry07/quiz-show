# Game REST API (HTTP)

All endpoints require `Authorization: Bearer <access_token>`.
Base URL defaults to `http://localhost:5200`.

## Create game
`POST /game`

Body:
```json
{ "quizId": "<quiz-id>" }
```

Response:
```json
{ "message": "Game created successfully", "status": 201, "data": { "pin": "123456", "state": "LOBBY", "playerCount": 0, "quizTitle": "My Quiz" } }
```

## Get game status
`GET /game/:pin`

Response fields include `state`, `playerCount`, `currentQuestionIndex`, `totalQuestions`.

## Join game
`POST /game/:pin/join`

Body:
```json
{ "nickname": "Player One" }
```

## Leave game
`POST /game/:pin/leave`

## Start game (host only)
`POST /game/:pin/start`

## Current question
`GET /game/:pin/question`

Returns:
- `question`: safe question (no answer)
- `timeRemainingMs`
- `currentQuestionIndex`, `totalQuestions`

Host receives `correctOptionIndex` after the question ends.

## Submit answer
`POST /game/:pin/answer`

Body:
```json
{ "answerIndex": 1 }
```

## End question (host only)
`POST /game/:pin/question/end`

## Reveal leaderboard (host only)
`POST /game/:pin/leaderboard/show`

## Get leaderboard
`GET /game/:pin/leaderboard?limit=5`

## Next question (host only)
`POST /game/:pin/question/next`

## End game (host only)
`POST /game/:pin/end`

## Delete game (host only)
`DELETE /game/:pin`
