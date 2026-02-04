# Potential ADR: E2E Testing with Testcontainers Pattern

## Context

The project needed a strategy for end-to-end (E2E) testing that exercises the complete application stack from API entrypoint to real database, ensuring high-fidelity verification of the system's behavior.

## Decision

Adopt `@testcontainers/postgresql` to provide ephemeral, per-run PostgreSQL containers for E2E tests, with a centralized helper module (`e2e-test.helper.ts`) that provides:

1. **E2ETestContext interface** - Type-safe context for sharing app, prisma, and container instances
2. **setupE2ETestEnvironment()** - Bootstraps real NestJS application with PostgreSQL container
3. **teardownE2ETestEnvironment()** - Graceful cleanup of resources
4. **cleanDatabase()** - Database cleanup respecting foreign key constraint order

## Key Implementation Details

```typescript
// PostgreSQL container per test suite
const container = await new PostgreSqlContainer('postgres:16-alpine')
  .withDatabase('sentinel_test')
  .withUsername('test')
  .withPassword('test')
  .start();

// Migrations via Prisma CLI
execSync('npx prisma migrate deploy', {
  env: { ...process.env, DATABASE_URL: container.getConnectionUri() },
});
```

## Rationale

- **High fidelity**: Tests against real PostgreSQL engine, catching database-specific issues
- **Isolation**: Each test suite gets a fresh container, eliminating shared state problems
- **Reproducibility**: Container environment is deterministic across CI and local runs
- **Migration verification**: Ensures Prisma migrations work correctly

## Consequences

**Positive:**

- Complete testing pyramid: Domain (TEST-001) → Infra (TEST-002) → Application (TEST-003) → E2E (this ADR)
- Real database behavior vs mocked/in-memory alternatives
- CI/CD compatibility via Docker-in-Docker or socket mounting

**Negative:**

- Requires Docker daemon available during test execution
- Slower test startup (~2-5 seconds for container spin-up)
- Additional CI configuration for Docker access

## Related Files

- `test/e2e/helpers/e2e-test.helper.ts` - Centralized E2E test helper
- `test/e2e/*.e2e-spec.ts` - E2E test specifications
- `test/jest-e2e.json` - Jest E2E configuration with 60s timeout

## References

- Commit: 19d12aa (refactor(e2e): extract shared test setup into centralized helper)
- Related ADRs: TEST-001, TEST-002, TEST-003
