# ADR-001: Zod 4 for Runtime Validation with OpenAPI Integration

**Status:** Accepted
**Date:** 2026-01-15
**Related ADRs:** API/ADR-001 (REST API Protocol)

---

## Context and Problem Statement

The Sentinel backend requires runtime type validation for external data entering the system. TypeScript provides compile-time type safety but offers no protection against malformed data from API requests, database queries, or external integrations at runtime. Invalid data can cause application crashes, security vulnerabilities, and unpredictable behavior in the RAG pipeline.

The system needed a validation solution that works seamlessly with the NestJS framework, provides TypeScript type inference, and generates OpenAPI documentation automatically. Zod 4 was released in January 2026 with significant performance improvements, making it a timely candidate for adoption.

## Decision Drivers

- Runtime safety for all external data inputs (API requests, database responses, external API calls)
- TypeScript type inference from validation schemas to maintain type safety
- OpenAPI/Swagger documentation generation for REST API endpoints
- Performance: validation overhead must be minimal (<5% of request latency)
- Developer experience: composable schemas with excellent error messages
- Integration with NestJS framework and existing TypeScript codebase

## Considered Options

1. **Zod 4** (TypeScript-first schema validation with OpenAPI integration)
2. **class-validator** (Decorator-based validation used by default in NestJS)
3. **No runtime validation** (Trust TypeScript types and external data sources)

## Decision Outcome

Chosen option: **Zod 4**, because it provides the strongest combination of type safety, performance, and developer experience. Zod 4 delivers 2x performance improvement over v3, making runtime validation overhead negligible. The library enables TypeScript type inference from schemas, eliminating the need to maintain parallel type definitions.

The implementation uses `@asteasolutions/zod-to-openapi` to automatically generate OpenAPI documentation from validation schemas. This creates a single source of truth for data shapes—Zod schemas define validation, TypeScript types, and API documentation simultaneously.

## Pros and Cons of the Options

### Zod 4

**Pros:**
- TypeScript type inference from schemas eliminates duplication
- 2x faster than Zod v3, minimizing runtime overhead
- Excellent error messages with detailed validation failures
- Composable and reusable schema definitions
- Automatic OpenAPI documentation generation
- Framework-agnostic (works outside NestJS)

**Cons:**
- Additional runtime overhead (minimal with Zod 4 performance)
- Schema maintenance required alongside business logic
- Learning curve for developers unfamiliar with schema-based validation

### class-validator

**Pros:**
- Native NestJS integration with decorator-based validation
- Familiar pattern for NestJS developers
- Declarative validation on DTO classes

**Cons:**
- Decorator-based approach requires TypeScript experimental decorators
- No automatic type inference (requires manual type maintenance)
- Less performant than Zod 4
- Limited composability compared to schema-based approach

### No Runtime Validation

**Pros:**
- Zero validation overhead
- No additional dependencies or maintenance

**Cons:**
- Application crashes from malformed input
- Security vulnerabilities from unchecked data
- Unpredictable behavior in RAG pipeline
- No guaranteed data contracts between components

## Consequences

**Positive:**
- Runtime safety prevents crashes and security issues from invalid data
- Single source of truth: Zod schemas define validation, types, and documentation
- Excellent developer experience with composable schemas and clear error messages
- Automatic OpenAPI documentation reduces manual maintenance
- Performance overhead is negligible with Zod 4 improvements

**Negative:**
- Additional dependency and learning curve for team members
- Schema maintenance required when data models change
- Slight runtime overhead (acceptable given performance gains in v4)

**Operational Impact:**
- Validation logic centralized in schema definitions rather than scattered across controllers
- Use cases explicitly validate inputs before processing, creating clear boundaries
- API documentation stays synchronized with validation rules automatically

## References

- `src/modules/simulation-history/schemas/create-simulation-history.schema.ts:1-45` (Zod schema with OpenAPI extension)
- `src/modules/simulation-history/use-cases/create-simulation-history.use-case.ts:1-60` (Validation in use case)
- `planos/001-kick-start/RELATORIO-arquitetura-clean-architecture.md` (Clean architecture validation layer)
