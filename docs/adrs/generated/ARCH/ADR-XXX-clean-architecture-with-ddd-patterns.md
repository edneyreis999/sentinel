# ADR-XXX: Clean Architecture with Domain-Driven Design Patterns

**Status:** Accepted
**Date:** 2026-01-29
**Related ADRs:** RAG/ADR-001 (NestJS Monolithic Architecture)

---

## Context and Problem Statement

The Sentinel project requires a scalable, maintainable internal architecture for the NestJS backend server that supports the RAG system's complexity. The monolithic architecture decision (RAG/ADR-001) established a single-process NestJS application, but did not define the internal code organization patterns.

The architectural challenge is structuring business logic to remain isolated from framework dependencies, enabling independent testing, future module extraction, and long-term maintainability. Without clear layer boundaries, NestJS applications tend to accumulate framework-coupled business logic that becomes difficult to test and evolve.

The decision draws from mature Clean Architecture implementations in similar projects, which demonstrate that domain logic isolation pays dividends in testability and adaptation capability, despite initial development overhead.

## Decision Drivers

- Framework independence for core business logic (domain and application layers must not depend on NestJS)
- Testability through interfaces and dependency inversion (mock infrastructure, test real domain logic)
- Future extraction path for microservices (clear boundaries enable module separation)
- SOLID principles enforcement through dependency rule compliance
- Team familiarity with DDD patterns from reference implementations
- Long-term maintainability prioritized over initial development speed

## Considered Options

1. **Clean Architecture with Domain-Driven Design** (four-layer dependency-inverted structure)
2. **Standard NestJS Architecture** (framework-coupled services and controllers)
3. **Hexagonal Architecture** (ports/adapters focus, less domain emphasis)

## Decision Outcome

Chosen option: **Clean Architecture with Domain-Driven Design**, because it provides the strongest isolation between business logic and framework dependencies while establishing clear extraction boundaries for future microservices migration. The four-layer structure (Domain, Application, Infrastructure, Nest-Modules) enforces the dependency rule that core layers never depend on outer frameworks or external concerns.

The architecture organizes code into strict layers with explicit dependency inversion: Domain layer contains entities, aggregates, value objects, and repository interfaces (output ports). Application layer contains use cases, input ports, and DTOs. Infrastructure layer implements repository interfaces with mappers and external service adapters. Nest-Modules layer provides controllers, resolvers, and dependency injection configuration.

This structure ensures that business rules can be validated through unit tests without NestJS containers, database connections, or external services. When the monolith reaches migration triggers (documented in RAG/ADR-001), application modules can extract to separate services with minimal refactoring.

## Pros and Cons of the Options

### Clean Architecture with DDD

**Pros:**
- Framework-independent domain logic enables fast unit tests without NestJS bootstrap
- Clear extraction boundaries for future microservices migration
- Dependency inversion enforces SOLID principles through interfaces
- Business logic centralized in aggregates and use cases
- Value objects prevent primitive obsession and encapsulate domain rules

**Cons:**
- Increased boilerplate code (interfaces, mappers, DTOs, factories)
- Steeper learning curve for teams unfamiliar with DDD patterns
- Initial development velocity reduced by layer discipline
- Over-engineering risk for simple CRUD operations

### Standard NestJS Architecture

**Pros:**
- Minimal boilerplate with direct framework usage
- Faster initial development with familiar patterns
- Lower learning curve for NestJS developers
- Sufficient for simple applications with straightforward business logic

**Cons:**
- Business logic coupled to framework difficult to test in isolation
- No clear boundaries for future module extraction
- Services tend to accumulate mixed concerns (persistence, domain, external calls)
- Refactoring cost increases exponentially over time

### Hexagonal Architecture

**Pros:**
- Ports/adapters pattern provides clear external boundaries
- Emphasis on application use cases over domain modeling
- Simpler than Clean Architecture for less complex domains

**Cons:**
- Less explicit domain layer structure (aggregates, value objects)
- Weaker guidance on domain-rich modeling versus anemic domain
- Clean Architecture provides more comprehensive layer definition

## Consequences

**Code Organization Impact:** All business logic resides in core modules (domain and application layers) with zero dependencies on NestJS, Prisma, Express, or external frameworks. Infrastructure layer contains all framework-specific implementations. This separation requires discipline but prevents framework coupling.

**Testing Strategy:** Domain logic tested through pure TypeScript unit tests without NestJS Test module. Application layer tested with mocked infrastructure implementations. Integration tests validate full stack through NestJS endpoints. This pyramid reduces test execution time and prevents flaky tests.

**Migration Readiness:** When microservices extraction triggers are reached (RAG/ADR-001: embedding API latency >500ms P95, multi-user concurrency >10), application modules with infrastructure can extract to independent services by copying only the Nest-Modules layer and reimplementing the dependency injection bindings. Core business logic requires zero changes.

**Development Workflow:** Team must follow dependency rule rigorously. Code reviews verify that imports never cross from core to infrastructure. CI pipeline validates layer compliance through dependency analysis tools.

## References

- `docs/decisoes-iniciais/entrevista-stack-rag-gdd-2026-01-29.md:30-56` (Architectural decision context)
- `docs/adrs/generated/RAG/ADR-001-nestjs-monolithic-architecture.md` (Monolithic architecture foundation)
- `docs/adrs/generated/API/ADR-001-rest-api-protocol.md` (API protocol layer context)
- Robert C. Martin - Clean Architecture (conceptual foundation)
