# ADR-004: E2E Testing with Testcontainers

**Status:** Accepted
**Date:** 2025-02-03
**Related ADRs:** ADR-001, ADR-002, ADR-003

## Context and Problem Statement

The testing strategy established a clear pyramid: domain tests with FakeBuilder (ADR-001), infrastructure contract tests (ADR-002), and application layer tests with in-memory repositories (ADR-003). However, this pyramid lacked end-to-end validation of the complete system stack from GraphQL API to real database persistence.

Manual testing with local PostgreSQL databases introduces environment inconsistencies and shared state problems. CI/CD pipelines fail when database schemas drift from migration scripts. Without automated E2E tests, the team cannot verify that Prisma migrations work correctly, NestJS module wiring is complete, or database constraints enforce data integrity as designed.

The challenge is providing high-fidelity E2E testing that exercises real PostgreSQL behavior while maintaining test isolation and reproducibility across development machines and CI environments.

## Decision Drivers

- Complete test pyramid validation from API layer to database persistence
- Real database engine verification to catch PostgreSQL-specific issues
- Test isolation to prevent shared state problems between test runs
- CI/CD reproducibility without manual database setup
- Migration verification to ensure Prisma schema changes deploy correctly
- Fast feedback with ephemeral environments per test suite

## Considered Options

1. **Testcontainers with ephemeral PostgreSQL containers** (Chosen)
2. **Shared PostgreSQL database with cleanup hooks**
3. **In-memory SQLite database for E2E tests**

## Decision Outcome

Chosen option: Testcontainers with ephemeral PostgreSQL containers, because it provides genuine PostgreSQL behavior with complete test isolation through per-suite container lifecycle. Each test suite receives a fresh database container, eliminating shared state issues while ensuring migrations execute correctly against the production database engine.

The implementation provides a centralized helper module with type-safe context sharing, automated setup/teardown lifecycle, and database cleanup utilities that respect foreign key constraint ordering. Tests use the same PostgreSQL version as production, catching engine-specific behaviors that in-memory databases would miss.

## Pros and Cons of the Options

### Testcontainers with ephemeral PostgreSQL containers

**Pros:**

- Complete test isolation with fresh container per suite
- Genuine PostgreSQL behavior including constraints, indexes, and query planner
- Deterministic environment across local development and CI/CD
- Migration verification ensures schema changes deploy successfully

**Cons:**

- Requires Docker daemon available during test execution
- Slower startup compared to in-memory alternatives
- Additional CI configuration for Docker-in-Docker or socket mounting

### Shared PostgreSQL database with cleanup hooks

**Pros:**

- Faster test execution without container startup overhead
- Simple configuration without Docker dependencies

**Cons:**

- Shared state risks when cleanup hooks fail or tests timeout
- Manual database setup required on every developer machine
- CI/CD environment drift when schemas diverge from migrations
- Cannot parallelize test suites without complex database isolation

### In-memory SQLite database for E2E tests

**Pros:**

- Fastest test execution with in-memory performance
- No external dependencies or Docker requirements

**Cons:**

- SQL dialect differences between SQLite and PostgreSQL
- Missing PostgreSQL-specific features like JSONB operators
- Does not validate migration scripts against production database
- Cannot catch PostgreSQL constraint violations or index behaviors

## Consequences

Adopting Testcontainers establishes complete testing pyramid coverage: domain tests with FakeBuilder, infrastructure contract tests, application tests with in-memory repositories, and E2E tests with real PostgreSQL containers. This validates the entire system stack from GraphQL resolver to database persistence with realistic behavior.

The centralized helper module provides consistent E2E test structure across all test suites. Developers use setupE2ETestEnvironment() to bootstrap the application with an ephemeral container, execute tests against real database operations, and teardownE2ETestEnvironment() for graceful cleanup. The cleanDatabase() utility enables test isolation within a single suite by respecting foreign key constraint order during cleanup.

CI/CD pipelines require Docker access through socket mounting or Docker-in-Docker configuration. Test execution time increases by 2-5 seconds per suite for container startup, balanced against the confidence gained from validating real database behavior. The 60-second timeout in jest-e2e.json accommodates container initialization overhead while preventing hung tests.

The pattern enables migration-driven development: teams can verify Prisma schema changes deploy correctly before merging, catching migration errors in CI rather than production. Integration with PostgreSQL 16 Alpine containers ensures lightweight images while matching production database capabilities.

## References

- test/e2e/helpers/e2e-test.helper.ts:1-76 (Centralized E2E helper implementation)
- test/jest-e2e.json:6 (60-second timeout configuration)
- test/e2e/user-preferences.e2e-spec.ts (Reference E2E test example)
