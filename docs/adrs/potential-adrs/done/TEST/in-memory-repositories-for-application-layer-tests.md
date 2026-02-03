# In-Memory Repositories for Application Layer Tests

## Context

**Date:** 2026-02-03
**Module:** TEST
**Related:** ADR-001 (FakeBuilder with PropOrFactory), Infrastructure Wrapper Testing Strategy

## Current Situation

The project has Application Layer use cases that depend on repository interfaces (ports). When testing these use cases, we have three options:

1. **Mock repositories** with jest.fn() - Creating fake implementations with Jest mocks
2. **Real database** - Integration tests with actual database (SQLite/PostgreSQL)
3. **In-memory repositories** - Real implementations using Map/Array data structures

Currently, the codebase shows mixed approaches:

- `get-user-preferences.use-case.spec.ts` uses `UserPreferencesInMemoryRepository` ✅
- `create-project.use-case.spec.ts` uses `ProjectRepositoryFake` ✅
- Old `simulation-history` tests used jest.fn() mocks ❌ (now refactored)

## Problem

**Should Application Layer tests use mocks or in-memory repositories?**

### Issues with Mocking Repositories

#### Over-Mocking

Tests often mock ALL repository methods when only 1-2 are used:

```typescript
// ❌ BAD: Over-mocking
repository = {
  insert: jest.fn(), // Used
  findById: jest.fn(), // Not used
  search: jest.fn(), // Not used
  update: jest.fn(), // Not used
  delete: jest.fn(), // Not used
  exists: jest.fn(), // Not used
};
```

This creates:

- **Fragile tests**: Break when unused methods change
- **Maintenance overhead**: Must update 6 methods when only testing 1
- **False confidence**: Tests pass without validating real behavior

#### Testing Implementation, Not Behavior

```typescript
// ❌ BAD: Testing HOW, not WHAT
expect(repository.insert).toHaveBeenCalledWith(expect.any(Object));
expect(repository.insert).toHaveBeenCalledTimes(1);
```

These assertions test:

- How many times a method was called
- What arguments were passed
- The order of calls

But they don't validate:

- Was the data actually persisted?
- Can it be retrieved later?
- Does the repository state change correctly?

#### Example: Cannot Validate Real Behavior

```typescript
// ❌ IMPOSSIBLE with mocks: Verify data was persisted
const result = await useCase.execute(input);
const persisted = await repository.findById(result.id); // Always null!
expect(persisted).toBeDefined(); // Fails - mock has no state
```

### Benefits of In-Memory Repositories

```typescript
// ✅ GOOD: Real in-memory implementation
class SimulationHistoryInMemoryRepository implements ISimulationHistoryRepository {
  private items = new Map<string, SimulationHistoryEntry>();

  async insert(entry: SimulationHistoryEntry): Promise<void> {
    this.items.set(entry.id, entry);
  }

  async findById(id: string): Promise<SimulationHistoryEntry | null> {
    return this.items.get(id) ?? null;
  }

  // ... other methods with real logic
}
```

#### 1. Tests Real Behavior

```typescript
// ✅ GOOD: Validates actual persistence
const result = await useCase.execute(input);
const persisted = await repository.findById(result.id);
expect(persisted).toBeDefined(); // Works! Data is stored
expect(persisted?.projectPath).toBe(input.projectPath);
```

#### 2. No Over-Mocking

- Repository implements ALL methods with real logic
- Tests use only what they need
- Unused methods don't break tests when they change

#### 3. Enables Future Validation

```typescript
// ✅ GOOD: Can verify side effects
await deleteUseCase.execute({ id: 'test-id' });

// Verify deletion actually happened
const deleted = await repository.findById('test-id');
expect(deleted).toBeNull();

// Verify it doesn't appear in search
const results = await repository.search({}, { page: 1, perPage: 10 });
expect(results.items).not.toContainEqual(expect.objectContaining({ id: 'test-id' }));
```

#### 4. Supports Test Data Setup

```typescript
// ✅ GOOD: Seed repository with test data
const existingProjects = ProjectFakeBuilder.theProjects(5).buildMany(5);
repository.seed(existingProjects);

// Test operates on realistic data
const result = await useCase.execute({ page: 2, perPage: 2 });
expect(result.items).toHaveLength(2);
expect(result.pagination.total).toBe(5);
```

## Real-World Example: Health Audit Findings

### Before Refactoring (Mocks)

**Score: 7.0/10** (Over-Mocking Avoidance)

Issues found:

- `create-simulation-history.use-case.spec.ts`: Mocked 6 methods, used 1 (insert)
- `delete-simulation-history.use-case.spec.ts`: Mocked 6 methods, used 2 (exists, delete)
- `get-simulation-history.use-case.spec.ts`: Mocked 6 methods, used 1 (findById)
- `update-simulation-status.use-case.spec.ts`: Mocked 6 methods, used 2 (findById, update)
- `list-simulation-history.use-case.spec.ts`: Mocked 6 methods, used 1 (search)

**Total: 30 unnecessary mocks across 5 files**

### After Refactoring (In-Memory)

**Score: 10.0/10** ✨

Changes:

```typescript
// Before
repository = {
  insert: jest.fn(),
  findById: jest.fn(),
  search: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
};

// After
repository = new SimulationHistoryInMemoryRepository();
repository.seed([
  /* test data */
]);
```

**Benefits achieved:**

- Zero mocks
- Real persistence validation
- Tests actual repository logic (filtering, pagination, sorting)
- Can verify complex scenarios (state transitions, data integrity)

## Decision Drivers

- **Behavior over implementation**: Test what the use case does, not how it does it
- **Maintainability**: Changes to repository interface don't cascade to mocks
- **Realistic testing**: In-memory repositories implement real logic (filtering, sorting, pagination)
- **Future-proof**: Enables validating side effects and complex scenarios
- **Consistency**: All Application Layer tests use same pattern

## Considered Options

### Option 1: Continue Using Mocks (NOT RECOMMENDED)

**Pros:**

- No need to create in-memory implementations
- Faster test execution (no real logic)

**Cons:**

- Over-mocking creates fragile tests
- Cannot validate real behavior
- Tests implementation details (spies, call counts)
- Maintenance overhead when repository methods change

### Option 2: Integration Tests with Real Database (NOT FOR APPLICATION LAYER)

**Pros:**

- Tests against real database
- Catches database-specific issues

**Cons:**

- Slower (database setup/teardown)
- Requires database migrations
- Mixes infrastructure concerns with use case tests
- Should be separate integration test suite

### Option 3: In-Memory Repositories (RECOMMENDED)

**Pros:**

- Tests real repository behavior
- No mocking fragility
- Fast (in-memory operations)
- Enables complex scenario validation
- Consistent with DDD ports & adapters

**Cons:**

- Requires creating in-memory implementations
- Must maintain in-memory implementations when interface changes

## Proposed Decision

**Use In-Memory Repositories for Application Layer Tests**

### Pattern

```typescript
// 1. Create in-memory repository (Infrastructure Layer)
export class EntityInMemoryRepository implements IEntityRepository {
  private items = new Map<string, Entity>();

  async insert(entity: Entity): Promise<void> {
    this.items.set(entity.id, entity);
  }

  async findById(id: string): Promise<Entity | null> {
    return this.items.get(id) ?? null;
  }

  // Utility methods for testing
  seed(entities: Entity[]): void {
    entities.forEach((e) => this.items.set(e.id, e));
  }

  clear(): void {
    this.items.clear();
  }

  getAll(): Entity[] {
    return Array.from(this.items.values());
  }
}

// 2. Use in tests (Application Layer)
describe('CreateEntityUseCase', () => {
  let repository: IEntityRepository;
  let useCase: CreateEntityUseCase;

  beforeEach(() => {
    repository = new EntityInMemoryRepository();
    useCase = new CreateEntityUseCase(repository);
  });

  it('should create entity and persist it', async () => {
    const input = CreateEntityInputFakeBuilder.anInput().build();

    const result = await useCase.execute(input);

    // ✅ Validate real behavior
    const persisted = await repository.findById(result.id);
    expect(persisted).toBeDefined();
    expect(persisted?.name).toBe(input.name);
  });
});
```

### Guidelines

#### When to Use In-Memory Repositories

- ✅ Application Layer use case tests
- ✅ Service tests that coordinate use cases
- ✅ Any test validating business rules with persistence

#### When to Use Real Database (Integration Tests)

- ✅ Repository implementation tests (Prisma, SQL queries)
- ✅ E2E tests (full stack validation)
- ✅ Database migration validation

#### When Mocks Are Acceptable

- ✅ External services (APIs, email, payment gateways)
- ✅ Infrastructure wrappers (when testing custom logic only)
- ✅ Framework integrations (NestJS, Express)

### Implementation Checklist

For each Domain aggregate, create:

- [ ] `{Entity}InMemoryRepository` in `src/core/{module}/infra/db/in-memory/`
- [ ] Implements full repository interface
- [ ] Includes utility methods: `seed()`, `clear()`, `getAll()`
- [ ] Use in Application Layer tests
- [ ] Remove existing jest.fn() mocks

### Example Locations

```
src/core/
├── simulation-history/
│   ├── domain/
│   │   └── ports/
│   │       └── simulation-history.repository.port.ts
│   ├── infra/
│   │   └── db/
│   │       ├── in-memory/
│   │       │   └── simulation-history-in-memory.repository.ts  ✅
│   │       └── prisma/
│   │           └── simulation-history-prisma.repository.ts
│   └── application/
│       └── __tests__/
│           └── *.use-case.spec.ts  (uses InMemoryRepository)
```

## References

- Test Health Audit (2026-02-03): Identified 30 unnecessary mocks across 5 files
- `get-user-preferences.use-case.spec.ts`: Reference implementation (Score 10/10)
- `create-project.use-case.integration.spec.ts`: Integration test pattern
- ADR-001 (FakeBuilder): Complementary pattern for test data generation
- Clean Architecture: Testing at use case boundaries with ports
