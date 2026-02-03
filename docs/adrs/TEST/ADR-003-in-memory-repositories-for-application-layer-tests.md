# ADR-XXX: In-Memory Repositories for Application Layer Tests

**Status:** Accepted
**Date:** 2026-02-03
**Related ADRs:** ADR-001

## Context and Problem Statement

Application Layer use cases depend on repository interfaces (ports in Clean Architecture). Testing these use cases requires choosing a strategy for repository implementations. The project faces a decision: use mocks with jest.fn(), real database integration tests, or in-memory repositories with Map/Array data structures.

Current evidence shows mixed approaches: UserPreferencesInMemoryRepository and ProjectRepositoryFake demonstrate in-memory patterns, while legacy simulation-history tests initially used jest.fn() mocks (later refactored). A test health audit (2026-02-03) identified 30 unnecessary mocks across 5 files, achieving only 7.0/10 on Over-Mocking Avoidance before refactoring.

Research on AI-assisted testing emphasizes token efficiency and behavior-focused validation. The FakeBuilder pattern (ADR-001) addresses test data generation, but repository behavior validation requires a complementary strategy that avoids implementation coupling while enabling real persistence verification.

## Decision Drivers

- Behavior over implementation: Validate what use cases accomplish, not method call counts
- Maintainability: Repository interface changes should not cascade to dozens of mock setups
- Realistic testing: Repositories must implement real logic for filtering, sorting, and pagination
- Future validation: Enable testing side effects and complex state transitions
- Token efficiency: Minimize test setup code for AI-assisted workflows
- DDD consistency: Align with ports & adapters pattern (Clean Architecture)

## Considered Options

1. **In-Memory Repositories** (Recommended)
2. **Mock repositories with jest.fn()**
3. **Real database integration tests**

## Decision Outcome

Chosen option: In-Memory Repositories for Application Layer tests, because they validate real repository behavior without database overhead, eliminate mocking fragility, and enable complex scenario validation while maintaining fast execution. This approach complements ADR-001 (FakeBuilder) by focusing on behavior validation rather than implementation details.

The pattern uses Map/Array data structures to implement full repository interfaces with real logic. Tests can seed repositories with FakeBuilder-generated entities, execute use cases, and verify actual persistence through retrieval operations. The refactored simulation-history tests demonstrate this pattern's effectiveness: score improved from 7.0/10 to 10.0/10 after replacing 30 mocks with a single in-memory repository.

## Pros and Cons of the Options

### In-Memory Repositories

**Pros:**

- Validates real persistence behavior (insert, retrieve, update, delete)
- No mocking fragility: unused methods don't break tests when changed
- Fast execution with in-memory operations (Map/Set performance)
- Enables complex validation (state transitions, data integrity, filtering logic)

**Cons:**

- Requires creating in-memory implementations for each repository
- Must maintain implementations when interfaces evolve
- Cannot detect database-specific issues (constraints, indexing)

### Mock repositories with jest.fn()

**Pros:**

- No additional implementation required
- Immediate test creation without infrastructure

**Cons:**

- Over-mocking creates fragile tests (must mock all methods when using 1-2)
- Cannot validate real behavior (data persistence, retrieval, state changes)
- Tests implementation details (call counts, spy assertions)
- High maintenance overhead when repository methods change

### Real database integration tests

**Pros:**

- Tests against actual database (catches SQL errors, constraints)
- Validates database-specific behavior (transactions, indexes)

**Cons:**

- Slower execution (database setup/teardown overhead)
- Requires migration management and database state isolation
- Mixes infrastructure concerns with use case behavior tests
- Should be separate integration test suite, not Application Layer unit tests

## Consequences

Adopting in-memory repositories establishes a consistent pattern for Application Layer testing. Each domain aggregate receives an in-memory repository implementation in `src/core/{module}/infra/db/in-memory/` with utility methods (seed, clear, getAll) for test setup.

The pattern enables validating complete CRUD workflows: create entities with use cases, verify persistence through findById, test updates and deletions with actual state changes. This complements the FakeBuilder pattern (ADR-001) by using builders for test data generation and in-memory repositories for behavior validation.

Test maintainability improves significantly. The simulation-history refactoring demonstrates this: removing 30 mocks eliminated fragile call count assertions, enabled realistic pagination/filtering tests, and improved the Over-Mocking Avoidance score from 7.0 to 10.0. When repository interfaces evolve, only the in-memory implementation updates, not dozens of test files.

The approach aligns with research on AI-assisted testing token efficiency. In-memory repositories reduce test setup code compared to verbose mock definitions, allowing more context within token limits. Tests focus on behavior (what persisted, what retrieved) rather than implementation (how many calls, what arguments).

Integration tests with real databases remain valuable for repository implementation testing (Prisma queries, PostgreSQL features) and E2E validation. The in-memory strategy applies specifically to Application Layer use case tests where fast feedback and behavior focus are priorities.

## References

- `docs/pesquisas/tests/IA para Testes Eficientes em TypeScript.md:26-76` (FakeBuilder pattern, token efficiency)
- `docs/pesquisas/tests/IA para Auditoria de Testes DDD.md:59-73` (PostgreSQL testing strategies, Testcontainers)
- `src/core/simulation-history/infra/db/in-memory/simulation-history-in-memory.repository.ts` (Reference implementation)
- `src/core/user-preferences/application/__tests__/get-user-preferences.use-case.spec.ts` (Pattern example: 10/10 score)
