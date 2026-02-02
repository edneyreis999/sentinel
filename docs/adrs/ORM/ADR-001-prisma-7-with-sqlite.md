# ADR-001: Prisma 7 with SQLite for Local Electron Backend Storage

**Status:** Accepted
**Date:** 2026-01-15
**Related ADRs:** ADR-001 (DB/PostgreSQL unified database)

---

## Context and Problem Statement

The Sentinel backend architecture comprises two distinct components: a remote RAG server using PostgreSQL with AGE/pgvector extensions for graph-vector-FTS operations, and a local Electron app backend for desktop client functionality. The local backend requires persistent storage for user preferences, recent project history, and simulation state tracking without the operational overhead of a full database server.

Running PostgreSQL locally within the Electron application would introduce significant resource consumption and complexity, including background process management, socket configuration, and database initialization overhead. The application needs an embedded, zero-configuration database solution that provides type-safe ORM integration with TypeScript while maintaining data integrity for local-only operations.

## Decision Drivers

- Electron app requires embedded database without separate server process
- Zero-configuration deployment for desktop client users
- Type-safe database client with first-class TypeScript support
- Local-only data (user preferences, recent projects, simulation history) does not require distributed capabilities
- Schema migration support for application updates
- Development velocity through tooling (Prisma Studio, auto-generated types)

## Considered Options

1. **Prisma 7 with SQLite (via better-sqlite3)**
2. **PostgreSQL local instance**
3. **TypeORM with SQLite**

## Decision Outcome

Chosen option: **Prisma 7 with SQLite**, because it provides embedded storage with zero-configuration deployment, excellent TypeScript integration through auto-generated types, and built-in migration support. The Prisma 7 release (January 2026) eliminated the Rust dependency from Prisma 6, significantly improving installation performance for Electron apps. SQLite's single-file database format eliminates the need for database server process management while providing ACID compliance for data integrity.

This decision specifically targets the local Electron backend and complements the PostgreSQL-based RAG server (ADR-001), ensuring appropriate technology choices for each operational context.

## Pros and Cons of the Options

### Prisma 7 with SQLite

**Pros:**
- Zero-configuration embedded database with single-file storage
- Type-safe database client with auto-generated TypeScript types
- Prisma 7 removes Rust dependency, reducing install time and bundle size
- Built-in migration system for schema evolution
- Prisma Studio for local data inspection during development
- Excellent TypeScript 5.4+ and Node.js 20+ support

**Cons:**
- SQLite limited to single writer, restricting concurrent write operations
- Not suitable for distributed systems or multi-user scenarios
- Cannot leverage advanced PostgreSQL features (AGE, pgvector, native FTS)
- Database file size practical limits for extremely large datasets

### PostgreSQL Local Instance

**Pros:**
- Feature parity with remote RAG server (unified technology stack)
- Superior concurrency and multi-user support
- Advanced features (full-text search, extensions, complex queries)

**Cons:**
- Requires separate background server process management
- Significant resource overhead for local app context
- Complex deployment and configuration for Electron packaging
- Overkill for local-only user data operations

### TypeORM with SQLite

**Pros:**
- Embedded storage without server process
- Active development and TypeScript support

**Cons:**
- Less type-safe than Prisma (manual type definitions)
- More boilerplate code for common operations
- Migration system less mature than Prisma
- Decorator-based approach conflicts with some TypeScript configurations

## Consequences

**Positive:**
- Electron app distribution simplified through embedded database (single file storage)
- Development velocity increases through Prisma's auto-generated types and migration tooling
- Type safety reduces runtime errors in local data persistence layer
- Prisma 7 architecture eliminates Rust dependency, reducing installation complexity
- Clear separation of concerns: local SQLite for user state, remote PostgreSQL for RAG operations

**Negative:**
- Single-writer SQLite limitation prevents concurrent write operations (acceptable for single-user desktop app)
- Different database technologies between local backend and RAG server increases learning surface
- Migration to PostgreSQL would be required if local backend evolves to multi-user scenarios

**Architecture Boundary:**
This decision establishes a clear architectural boundary: the local Electron backend manages user-facing state (preferences, recent projects, simulation history) via SQLite, while the remote RAG server handles knowledge graph operations via PostgreSQL with AGE/pgvector. This separation optimizes technology choices for each operational context.

## References

- prisma/schema.prisma:1-32
- docs/planos/001-kick-start/epico-kickstart.md
- docs/decisoes-iniciais/entrevista-stack-rag-gdd-2026-01-29.md:66-98
