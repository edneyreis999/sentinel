# Infrastructure Wrapper Testing Strategy

## Context

**Date:** 2025-02-02
**Module:** TEST
**Related:** ADR-001 (FakeBuilder with PropOrFactory)

## Current Situation

The project has a `PrismaService` that wraps PrismaClient with a PostgreSQL adapter:

```typescript
// src/database/prisma.service.ts
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    this.prisma = new PrismaClient({ adapter, log: ['query', 'info', 'warn', 'error'] });
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  get recentProject() { return this.prisma.recentProject; }
  get userPreferences() { return this.prisma.userPreferences; }
  get simulationHistoryEntry() { return this.prisma.simulationHistoryEntry; }
}
```

Current unit tests are failing because Jest cannot properly mock PrismaClient + adapter interactions. Other tests (validateInput, validateResponse, app.resolver) pass successfully.

## Problem

Should we invest time in fixing unit tests for the PrismaService, or is there a better testing strategy for infrastructure wrappers?

## Considerations

### Infrastructure Wrapper Characteristics
- **Thin wrapper**: Minimal logic, mostly delegation
- **External dependency**: PrismaClient is a well-tested library
- **Framework integration**: Uses NestJS lifecycle hooks
- **No business logic**: Pure infrastructure wiring

### Testing Cost-Benefit Analysis

| Test Type | Value | Cost | Recommendation |
|-----------|-------|------|----------------|
| Unit tests of PrismaService | Low | High (complex mocks) | Skip |
| Integration tests of Repositories | High | Medium | Essential |
| E2E tests of Resolvers | High | Medium | Essential |
| Contract tests (interface validation) | Low | Low | Optional |

### Industry Best Practices

1. **Don't test the framework**: NestJS lifecycle hooks are framework concerns
2. **Don't test external libraries**: PrismaClient is already tested
3. **Test your code**: Focus on business logic in Use Cases and Repositories
4. **Integration over unit tests**: For database interactions, real tests beat mocks

## Options

### Option 1: Fix Unit Tests (NOT RECOMMENDED)
- Pros: All tests pass
- Cons: High maintenance, tests framework not our code, complex mocks

### Option 2: Integration Tests Only (RECOMMENDED)
- Pros: Tests real behavior, catches database issues, validates Prisma queries
- Cons: Slower than unit tests, requires test database

### Option 3: Contract Tests + Integration Tests (RECOMMENDED)
- Pros: Validates interface, catches integration issues, minimal overhead
- Cons: Slightly more setup than Option 2

## Proposed Solution

### Remove Unit Tests, Add Integration Tests

**1. Replace unit tests with simple contract test:**

```typescript
describe('PrismaService - Contract', () => {
  it('should expose all required Prisma models', () => {
    const service = new PrismaService();

    expect(service.recentProject).toBeDefined();
    expect(service.userPreferences).toBeDefined();
    expect(service.simulationHistoryEntry).toBeDefined();
    expect(service.$connect).toBeInstanceOf(Function);
    expect(service.$disconnect).toBeInstanceOf(Function);
    expect(service.$transaction).toBeInstanceOf(Function);
  });
});
```

**2. Add integration tests for Repositories:**

```typescript
describe('PrismaProjectRepository - Integration', () => {
  let prisma: PrismaService;
  let repository: PrismaProjectRepository;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.$transaction(async (tx) => {
      await tx.project.deleteMany();
    });
  });

  it('should save and retrieve project', async () => {
    // Test real database behavior
  });
});
```

### Test Coverage Requirements

**Before removing PrismaService unit tests, ensure:**

- [ ] Use Cases have integration tests with real database
- [ ] Repositories have tests validating Prisma queries
- [ ] E2E tests cover complete flows (API → UseCase → Repository → DB)
- [ ] CI/CD runs migrations before tests
- [ ] Test database is isolated (not dev/prod)

### When to Unit Test Infrastructure Wrappers

**Only when there is custom logic:**

- Retry logic for connections
- Custom logging/metrics
- Transaction wrappers
- Health check implementations
- Circuit breakers

**Current PrismaService has NONE of these**, so unit tests provide minimal value.

## Decision

**Remove failing unit tests for PrismaService** and replace with:
1. Simple contract test (interface validation)
2. Integration tests for Repositories that use PrismaService

**Rationale:** Testing framework code and external libraries provides minimal value. Focus testing efforts on business logic (Use Cases) and data access (Repositories) where bugs actually occur.

## Implementation Plan

1. Create this ADR
2. Remove complex mocks from `prisma.service.spec.ts`
3. Replace with simple contract test
4. Add integration tests for first Repository (when created)
5. Update TEST-001 to reference infrastructure testing strategy
6. Document integration test setup in contributing guide

## References

- Testing Pyramid: Martin Fowler's "Test Pyramid"
- Prisma Testing Guide: Integration over unit for database
- Clean Architecture: Test at use case boundaries
