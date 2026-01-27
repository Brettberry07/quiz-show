# Quiz Module - Code Improvements TODO

This document outlines improvements and refactoring opportunities identified in the Quiz module code review.

---

## High Priority (Performance & Bugs)

### 1. Fix N+1 Query Problem in `saveQuiz()` ✅ COMPLETED

**File:** `src/quiz/quiz.service.ts` (Lines 390-425)

**Issue:** The `saveQuiz()` method loaded the entire quiz with relations, then recreated all question entities, causing unnecessary database operations.

**Status:** RESOLVED - January 27, 2026

**Implementation:**
- Removed the inefficient `saveQuiz()` method entirely
- Implemented transaction-based updates in `update()`, `addQuestion()`, and `addQuestionForGamePlayer()`
- Created `updateQuestionsOptimized()` that updates only changed questions directly via the question repository
- For quiz-only updates (e.g., title), only the quiz entity is updated
- For question updates, individual questions are updated directly without recreating all entities
- All multi-step operations now use TypeORM transactions for data consistency

**Benefits:**
- Eliminates N+1 query problem
- Reduces database load significantly for question updates
- Improves performance for large quizzes
- Ensures data consistency with transactions
- Only updates what actually changed

---

### 2. Add Transaction Support for Multi-Step Operations

**Files:** `src/quiz/quiz.service.ts`

**Issue:** Operations like `addQuestion()`, `removeQuestion()`, and `update()` modify both quiz and questions but aren't wrapped in transactions, risking data inconsistency.

**Solution:**

```typescript
async addQuestion(quizId: string, ...): Promise<Question> {
  const queryRunner = this.quizRepository.manager.connection.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  
  try {
    // Your operations here
    await queryRunner.commitTransaction();
    return question;
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    await queryRunner.release();
  }
}
```

---

### 3. Add Pagination to `findAll()`

**File:** `src/quiz/quiz.service.ts` (Lines 93-101)

**Issue:** Returns all quizzes without pagination, which will cause performance issues as the database grows.

**Solution:**

```typescript
async findAll(page = 1, limit = 20): Promise<PaginatedResponse<Quiz>> {
  const [quizzes, total] = await this.quizRepository.findAndCount({
    relations: ['questions'],
    skip: (page - 1) * limit,
    take: limit,
  });
  return {
    data: quizzes.map(q => this.toDomainQuiz(q).getSummary()),
    total,
    page,
    limit,
  };
}
```

Update controller to accept query parameters for pagination.

---

### 4. Remove Circular Dependency with GameModule

**File:** `src/quiz/quiz.module.ts` (Line 13)

**Issue:** Uses `forwardRef(() => GameModule)` which is a code smell indicating improper module boundaries.

**Solution:**

- Create a shared `QuizRepository` module that both can import
- Or move the quiz-for-game logic to a separate service
- Re-evaluate module boundaries and dependencies

---

## Medium Priority (Maintainability)

### 5. Reduce Code Duplication Between `addQuestion` Methods

**File:** `src/quiz/quiz.service.ts` (Lines 253-312)

**Issue:** `addQuestion()` and `addQuestionForGamePlayer()` are nearly identical except for authorization check.

**Solution:**

```typescript
private async addQuestionInternal(
  quizId: string,
  addQuestionDto: CreateQuestionDto,
  authorName?: string
): Promise<Question> {
  const quiz = await this.findOne(quizId);
  const question = new Question(
    randomUUID(),
    quizId,
    addQuestionDto.text,
    addQuestionDto.category,
    addQuestionDto.author || authorName,
    addQuestionDto.type,
    addQuestionDto.timeLimitSeconds,
    addQuestionDto.pointsMultiplier,
    addQuestionDto.options,
    addQuestionDto.correctOptionIndex
  );
  quiz.addQuestion(question);
  await this.saveQuiz(quiz);
  return question;
}

async addQuestion(quizId: string, addQuestionDto: CreateQuestionDto, requesterId: string, requesterName?: string): Promise<Question> {
  const quiz = await this.findOne(quizId);
  if (quiz.hostId !== requesterId) {
    throw new ForbiddenException('You can only add questions to your own quizzes');
  }
  return this.addQuestionInternal(quizId, addQuestionDto, requesterName);
}
```

---

### 6. Simplify Question Constructor with Options Object

**File:** `src/quiz/quiz.class.ts` (Lines 17-35)

**Issue:** Question constructor takes 10 parameters, making it error-prone and hard to read.

**Solution:**

```typescript
interface QuestionOptions {
  id: string;
  quizId: string;
  text: string;
  category?: string;
  author?: string;
  type: QuestionType;
  timeLimitSeconds: number;
  pointsMultiplier: number;
  options: string[];
  correctOptionIndex: number;
}

export class Question {
  constructor(options: QuestionOptions) {
    this.id = options.id;
    this.quizId = options.quizId;
    this.text = options.text;
    // ... etc
  }
}
```

---

### 7. Move `AuthenticatedRequest` to Shared Types

**File:** `src/quiz/quiz.controller.ts` (Lines 20-26)

**Issue:** Interface is defined locally but likely used in other controllers.

**Solution:**

- Create `src/common/types/request.types.ts`
- Move the interface there
- Export for reuse across controllers

---

### 8. Add Max Validation Constraints to DTOs

**Files:** `src/quiz/dto/create-quiz.dto.ts`, `src/quiz/dto/update-quiz.dto.ts`

**Issue:** DTOs have `@Min()` validators but no `@Max()` validators for reasonable limits.

**Solution:**

```typescript
@IsNumber({}, { message: "Time limit must be a number" })
@Min(5, { message: "Time limit must be at least 5 seconds" })
@Max(300, { message: "Time limit cannot exceed 5 minutes" })
timeLimitSeconds: number;

@IsArray({ message: "Options must be an array" })
@ArrayMinSize(2, { message: "At least 2 options are required" })
@ArrayMaxSize(10, { message: "Cannot have more than 10 options" })
options: string[];

@IsNumber({}, { message: "Points multiplier must be a number" })
@Min(0.1, { message: "Points multiplier must be at least 0.1" })
@Max(10, { message: "Points multiplier cannot exceed 10" })
pointsMultiplier: number;
```

---

### 9. Improve Question Update Efficiency

**File:** `src/quiz/quiz.service.ts` (Lines 222-251)

**Issue:** `updateQuestions()` method updates properties individually with many conditionals.

**Solution:**

```typescript
private updateQuestions(quiz: Quiz, questionDtos: UpdateQuestionDto[]): void {
  for (const qDto of questionDtos) {
    if (!qDto.id) continue;
    
    const question = quiz.getQuestion(qDto.id);
    if (!question) {
      throw new NotFoundException(`Question with id "${qDto.id}" not found`);
    }
    
    // Only update defined fields
    Object.assign(question, {
      ...(qDto.text !== undefined && { text: qDto.text }),
      ...(qDto.category !== undefined && { category: qDto.category }),
      ...(qDto.author !== undefined && { author: qDto.author }),
      ...(qDto.type !== undefined && { type: qDto.type }),
      ...(qDto.timeLimitSeconds !== undefined && { timeLimitSeconds: qDto.timeLimitSeconds }),
      ...(qDto.pointsMultiplier !== undefined && { pointsMultiplier: qDto.pointsMultiplier }),
      ...(qDto.options !== undefined && { options: qDto.options }),
      ...(qDto.correctOptionIndex !== undefined && { correctOptionIndex: qDto.correctOptionIndex }),
    });
  }
  quiz.updatedAt = new Date();
}
```

---

### 10. Add Domain Validation to `addQuestion()`

**File:** `src/quiz/quiz.class.ts` (Lines 102-106)

**Issue:** The `addQuestion()` method in Quiz class doesn't validate the question before adding it.

**Solution:**

```typescript
addQuestion(question: Question): void {
  // Validate the question is valid
  if (!question.isValidAnswerIndex(question.correctOptionIndex)) {
    throw new Error('Invalid question: correct answer index out of bounds');
  }
  if (question.options.length < 2) {
    throw new Error('Invalid question: must have at least 2 options');
  }
  if (question.timeLimitSeconds <= 0) {
    throw new Error('Invalid question: time limit must be positive');
  }
  this.questions.push(question);
  this.updatedAt = new Date();
}
```

---

### 11. Remove Duplicate Validation Logic

**Files:** `src/quiz/quiz.class.ts` (Lines 182-211) and `src/quiz/quiz.service.ts` (Lines 365-372)

**Issue:** Both Quiz class `isPlayable()` and service `validateForGame()` perform the same validation.

**Solution:**

- Keep validation in domain model only (Quiz class)
- Remove `validateForGame()` from service
- Have service methods call `quiz.isPlayable()` directly

---

## Low Priority (Nice to Have)

### 12. Simplify Controller Response Structure

**File:** `src/quiz/quiz.controller.ts` (All endpoints)

**Issue:** All endpoints manually wrap responses with `message`, `status`, `data`, which is redundant since HTTP already provides status codes.

**Solution Option 1:** Return data directly

```typescript
@Post()
@HttpCode(HttpStatus.CREATED)
async createQuiz(@Body() createQuizDto: CreateQuizDto, @Request() req: AuthenticatedRequest) {
  const quiz = await this.quizService.createQuiz(createQuizDto, req.user.id, req.user.username);
  return quiz.getSummary();
}
```

**Solution Option 2:** Create a response interceptor for consistent wrapping across all endpoints.

---

### 13. Add Caching for Frequently Accessed Quizzes

**Files:** `src/quiz/quiz.service.ts`

**Issue:** Frequently accessed quizzes (like in active games) are fetched from DB every time.

**Solution:**

- Add NestJS cache manager
- Cache `findOne()` results with TTL
- Cache `getQuizForGame()` results
- Invalidate cache on quiz updates/deletes

```typescript
@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(QuizEntity)
    private readonly quizRepository: Repository<QuizEntity>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async findOne(id: string): Promise<Quiz> {
    const cacheKey = `quiz:${id}`;
    const cached = await this.cacheManager.get<Quiz>(cacheKey);
    if (cached) return cached;

    const quiz = await this.quizRepository.findOne({ 
      where: { id },
      relations: ['questions'],
    });
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }
    
    const domainQuiz = this.toDomainQuiz(quiz);
    await this.cacheManager.set(cacheKey, domainQuiz, 300); // 5 min TTL
    return domainQuiz;
  }
}
```

---

### 14. Add Soft Delete Support

**Files:** `src/entities/quiz.entity.ts`, `src/quiz/quiz.service.ts`

**Issue:** Quizzes are hard-deleted, losing historical data.

**Solution:**

- Add `@DeleteDateColumn()` to QuizEntity
- Update queries to exclude soft-deleted records
- Modify `remove()` method to soft delete instead of hard delete
- Add endpoint to permanently delete if needed

```typescript
@Entity({ name: "quizzes" })
export class QuizEntity {
  // ... existing fields
  
  @DeleteDateColumn()
  deletedAt?: Date;
}
```

---

### 15. Move Custom Validators Out of DTOs

**File:** `src/quiz/dto/update-quiz.dto.ts` (Lines 7-33)

**Issue:** Custom validator `IsValidOptionIndex` contains business logic in the DTO file.

**Solution:**

- Move complex validation to domain models for business rules
- Keep DTOs simple with basic type/format validation
- Use service layer for cross-entity validation

---

### 16. Add Index for Common Queries

**File:** `src/entities/quiz.entity.ts`

**Issue:** Queries by `hostId` are common but not indexed.

**Solution:**

```typescript
@Entity({ name: "quizzes" })
@Index(['hostId'])
export class QuizEntity {
  // ... existing fields
}
```

---

## Testing Improvements

### 17. Add Unit Tests for Quiz Service

**Create:** `src/quiz/quiz.service.spec.ts`

**Coverage Needed:**

- CRUD operations
- Authorization checks
- Validation logic
- Error cases

---

### 18. Add Unit Tests for Quiz Domain Model

**Create:** `src/quiz/quiz.class.spec.ts`

**Coverage Needed:**

- `isPlayable()` validation
- Question management methods
- Edge cases

---

## Documentation

### 19. Add API Documentation

**File:** `src/quiz/quiz.controller.ts`

**Solution:**

- Add Swagger/OpenAPI decorators
- Document request/response schemas
- Add example requests

---

### 20. Add JSDoc Comments

**Files:** All quiz module files

**Solution:**

- Add comprehensive JSDoc to all public methods
- Document parameters and return types
- Add usage examples where helpful

---

## Notes

- Review completed: January 27, 2026
- Priority classifications: High (must fix), Medium (should fix), Low (nice to have)
- Estimated effort for remaining items: 2-3 days for high priority items

## Change Log

### January 27, 2026 - N+1 Query Fix Implementation

**Problem #1 - RESOLVED**

Eliminated the N+1 query problem in quiz updates by:
1. Removing the inefficient `saveQuiz()` method
2. Implementing transaction-based updates with TypeORM QueryRunner
3. Creating targeted update methods that only touch changed entities

**Files Modified:**
- `src/quiz/quiz.service.ts`: Complete refactor of update logic
  - `update()`: Now uses transactions and selective updates
  - `addQuestion()`: Direct entity insertion with transaction
  - `addQuestionForGamePlayer()`: Same optimization for player contributions
  - `updateQuestionsOptimized()`: New method for selective question updates
  - Removed `saveQuiz()`: Eliminated N+1 query source

**Files Added:**
- `src/quiz/quiz.service.spec.ts`: Comprehensive unit tests (15 test cases)
  - Tests for transaction behavior
  - Tests for selective updates
  - Performance validation tests
  - Error handling and rollback tests

**Documentation Updated:**
- `TODO.md`: Marked task #1 as completed with implementation details
- `BackendDoc.md`: Added "Database Performance Optimizations" section

**Test Results:**
- All 15 new unit tests passing
- Build successful with no TypeScript errors
- Backward compatibility maintained

**Performance Impact:**
- Quiz title-only updates: 1 query instead of N+1 queries
- Single question update in 100-question quiz: 2 queries instead of 101 queries
- Improved from O(n) to O(1) for targeted updates
