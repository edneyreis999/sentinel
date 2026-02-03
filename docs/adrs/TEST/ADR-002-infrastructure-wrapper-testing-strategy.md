# ADR-XXX: Infrastructure Wrapper Testing Strategy

**Status:** Accepted
**Date:** 2025-02-02
**Related ADRs:** TEST/ADR-001 (FakeBuilder with PropOrFactory Pattern)

## Context and Problem Statement

The NestJS application includes infrastructure wrappers that delegate to external libraries and framework lifecycle hooks. The primary example is a service wrapper that adapts an ORM client with a database connection adapter, implementing framework lifecycle methods for connection management and exposing model accessors.

Current unit tests for these infrastructure wrappers are failing due to complex mocking requirements for the interaction between the ORM client and database adapter. The underlying challenge is determining the appropriate testing strategy for thin wrappers with minimal logic that primarily wire external dependencies to framework contracts.

Infrastructure wrappers exhibit distinct characteristics: they contain minimal business logic, delegate to well-tested external libraries, integrate with framework lifecycle patterns, and serve as pure infrastructure wiring. This raises the question of whether investing in unit tests for such components provides sufficient value relative to the maintenance cost of complex mocks.

## Decision Drivers

- Testing cost-benefit analysis: high mock complexity versus low code coverage value
- Industry best practices: avoid testing framework code and external libraries
- Test pyramid guidance: integration tests more valuable than unit tests for database interactions
- Development velocity: focus testing efforts on business logic and data access
- Test reliability: real database tests catch more issues than mocked unit tests
- Maintenance burden: complex mocks break frequently when libraries upgrade

## Considered Options

1. **Contract tests with integration testing** (Chosen)
2. **Fix unit tests with complex mocking**
3. **Integration tests only without contract validation**

## Decision Outcome

Chosen option: **Contract tests with integration testing**, because it validates interface contracts with minimal overhead while focusing comprehensive testing on repository and use case layers where actual business logic resides. This approach eliminates the maintenance burden of complex mocks for infrastructure wrappers that contain no custom logic worth unit testing.

The strategy replaces unit tests with lightweight contract tests that verify the wrapper exposes required interfaces without mocking external dependencies. Integration tests at the repository layer validate real database behavior with actual connections, catching issues that mocked unit tests would miss. This aligns with industry guidance to avoid testing framework lifecycle hooks and external libraries that have their own test suites.

## Pros and Cons of the Options

### Contract tests with integration testing

**Pros:**

- Lightweight contract validation with zero mocking overhead
- Integration tests catch real database and query issues
- Maintenance effort focused on business logic, not infrastructure mocks
- Clear signal when interfaces change or models are added
- Tests validate actual system behavior, not mock expectations

**Cons:**

- Slightly more initial setup than pure unit tests
- Integration tests slower than unit tests (requires test database)
- Requires CI/CD pipeline to run database migrations before tests

### Fix unit tests with complex mocking

**Pros:**

- All tests pass in unit test suite
- Faster test execution than integration tests

**Cons:**

- High maintenance burden for complex mock configurations
- Tests validate mock behavior, not real system behavior
- Tests become brittle when external libraries upgrade
- Testing framework code and external libraries provides minimal value
- Does not catch integration issues between ORM and database

### Integration tests only without contract validation

**Pros:**

- Tests real behavior without mocking overhead
- Catches actual database and integration issues
- Minimal test boilerplate

**Cons:**

- Missing fast contract validation signal when interfaces change
- Slower feedback loop for simple interface regressions
- No lightweight check for required model accessors

## Consequences

Adopting contract tests with integration testing establishes a clear boundary for infrastructure testing strategy: thin wrappers with no custom logic receive only interface validation, while repositories and use cases receive comprehensive integration testing with real database connections. This prevents test suite accumulation around framework code while ensuring business logic has strong test coverage.

The immediate impact is removal of failing unit tests for infrastructure wrappers, replaced by lightweight contract tests that verify exposed interfaces. Integration tests at the repository layer provide comprehensive validation of database operations, catching issues that mocked unit tests cannot detect. This requires test database setup in CI/CD pipelines and migration execution before test runs.

Development velocity increases by focusing testing effort on layers with actual business logic. The test pyramid shifts toward more integration tests and fewer unit tests for infrastructure, accepting slower test execution in exchange for higher-confidence validation. Teams must ensure repositories have integration test coverage before removing infrastructure unit tests.

The pattern establishes a rule for when to unit test infrastructure wrappers: only when custom logic is present. Examples include retry mechanisms, custom logging, transaction wrappers, health checks, or circuit breakers. Pure delegation wrappers without custom behavior receive contract tests only.

## References

- src/database/prisma.service.ts:1-36 (Infrastructure wrapper example)
- docs/pesquisas/IA para Testes Eficientes em TypeScript.md (Testing strategy research)
- docs/adrs/TEST/ADR-001-fakebuilder-with-proporfactory-pattern.md (Related test data strategy)
