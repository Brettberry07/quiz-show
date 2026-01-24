# Backend Review Findings (Coding Conventions + Performance)

## Efficiency / DB Usage

1) **Summary endpoints materialize full domain objects**

- Location: [backend/src/quiz/quiz.service.ts](backend/src/quiz/quiz.service.ts)
- `findAll`, `findAllByHost` convert entities to full `Quiz` objects just to return summaries.
- **Impact:** extra object allocations + more DB columns than needed.
- **Fix:** `select` only summary fields and use `COUNT` for question totals; avoid building full domain objects.

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

2) Clean up naming inconsistencies and response status patterns. (#1-3)
