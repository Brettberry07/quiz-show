# Backend Review Findings (Coding Conventions + Performance)

## Efficiency / DB Usage

1) **Eager loading questions on every quiz query**

- Location: [backend/src/entities/quiz.entity.ts](backend/src/entities/quiz.entity.ts)
- `@OneToMany(..., { eager: true })` loads full questions for *all* quiz queries (including list & stats).
- **Impact:** unnecessary payload & CPU for summary endpoints.
- **Fix:** remove `eager: true`; load questions only in endpoints that need them via `relations: ['questions']` or query builder.

2) **Multiple reads per write in `QuizService`**

- Location: [backend/src/quiz/quiz.service.ts](backend/src/quiz/quiz.service.ts)
- `update`, `addQuestion`, `removeQuestion` call `findOne`, then `saveQuiz`, which re-queries the same quiz before saving.
- **Impact:** 2–4 DB hits per request.
- **Fix:** use `preload` or keep the loaded entity and `save` once. Optionally wrap in a transaction and persist once.

3) **Redundant writes on question deletion**

- Location: [backend/src/quiz/quiz.service.ts](backend/src/quiz/quiz.service.ts)
- `removeQuestion` deletes the question then re-saves the entire quiz/questions array.
- **Impact:** extra DB writes and larger payloads.
- **Fix:** delete the question and update quiz `updatedAt` via `update()`, or rely on cascade and avoid full re-save.

4) **Summary endpoints materialize full domain objects**

- Location: [backend/src/quiz/quiz.service.ts](backend/src/quiz/quiz.service.ts)
- `findAll`, `findAllByHost` convert entities to full `Quiz` objects just to return summaries.
- **Impact:** extra object allocations + more DB columns than needed.
- **Fix:** `select` only summary fields and use `COUNT` for question totals; avoid building full domain objects.

5) **Stats endpoint loads everything**

- Location: [backend/src/quiz/quiz.service.ts](backend/src/quiz/quiz.service.ts)
- `getStats` uses `find()` and reduces in memory.
- **Impact:** scales poorly with many quizzes/questions.
- **Fix:** `quizRepository.count()` and `questionRepository.count()`; compute average from counts.

## Coding Conventions / Consistency

1) **Method naming inconsistent**

- Location: [backend/src/db/db.service.ts](backend/src/db/db.service.ts)
- `SaveRefreshToken` uses PascalCase; others are camelCase.
- **Fix:** rename to `saveRefreshToken` and update call sites.

2) **DTO naming inconsistent**

- Location: [backend/src/auth/auth.service.ts](backend/src/auth/auth.service.ts)
- `loginUserDto` uses lower camel case.
- **Fix:** rename to `LoginUserDto` to follow NestJS DTO class conventions.

3) **Response status handling inconsistent**

- Location: [backend/src/users/users.controller.ts](backend/src/users/users.controller.ts) vs other controllers.
- Some endpoints return `status` in body instead of throwing HTTP exceptions.
- **Fix:** use `NotFoundException`/`HttpException` for uniform HTTP status behavior.

## Quick Wins (Order of Impact)

1) Remove eager loading and add explicit `relations` only where needed. (#1)
2) Replace `find()`-based stats with `count()`. (#5)
3) Reduce redundant saves/reads in `QuizService`. (#2)
4) Clean up naming inconsistencies and response status patterns. (#1-3)
