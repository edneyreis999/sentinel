# ADR-001: REST API as Primary Protocol for RAG System

**Status:** Accepted
**Date:** 2026-01-30

---

## Context and Problem Statement

The Sentinel RAG system requires an API protocol to expose its hybrid search and entity extraction capabilities to external clients. The system is designed as a single-user MVP within a NestJS monolithic architecture, prioritizing simplicity and rapid validation over advanced features.

The API must support natural language RAG queries, entity listing, and administrative entity extraction operations. The protocol choice impacts all future client integrations, mobile applications, third-party tools, and the evolution path toward potential microservices architecture.

The decision was made during initial architectural planning (January 2026) as part of establishing the foundational client-server interaction model for the MVP phase.

## Decision Drivers

- Simplicity for single-user MVP context (no multi-tenancy, minimal complexity)
- Alignment with NestJS ecosystem and existing TypeScript codebase
- Standard tooling for API documentation and client generation (OpenAPI/Swagger)
- Stateless interaction model suitable for RAG query workflows
- Clear evolution path to microservices if needed (gRPC/NATS migration)
- Low operational overhead for solo developer workflow

## Considered Options

1. **REST API** (Resource-oriented)
2. **GraphQL** (Query-flexible schema)
3. **gRPC** (High-performance RPC)

## Decision Outcome

Chosen option: **REST API**, because it provides the optimal balance of simplicity, standard tooling, and alignment with the single-user MVP scope. REST eliminates unnecessary complexity while maintaining clear semantics for CRUD operations and RAG query execution.

The decision explicitly accepts that REST is intentionally temporary for MVP validation, with a documented migration path to gRPC when transitioning to microservices architecture (triggered by embedding API latency >500ms P95 or need for local models).

REST endpoints are implemented using NestJS controllers with class-validator DTOs and OpenAPI/Swagger documentation for type-safe client generation.

## Pros and Cons of the Options

### REST API

**Pros:**
- Ubiquitous understanding across development community
- Built-in NestJS support with decorators and controllers
- OpenAPI/Swagger automatic documentation generation
- Stateless design aligns with RAG query patterns
- Standard HTTP status codes and error handling
- No additional complexity for single-user workflows

**Cons:**
- Over-fetching potential for complex entity queries (mitigated by DTO design)
- No built-in streaming for long-running LLM responses (acceptable for MVP)
- Stateless design prevents real-time updates (not required initially)

### GraphQL

**Pros:**
- Flexible query capabilities eliminate over-fetching
- Schema-first design with strong typing
- Single endpoint for all operations
- Built-in introspection and documentation

**Cons:**
- Unnecessary complexity for simple CRUD + RAG operations in MVP
- Steeper learning curve for integration developers
- Additional dependencies and boilerplate in NestJS
- Over-engineered for single-user context with predefined queries

### gRPC

**Pros:**
- High performance with Protocol Buffers serialization
- Strong typing and code generation
- Bi-directional streaming for real-time features
- Planned for future microservices migration

**Cons:**
- Limited browser support without gRPC-Web proxy
- Overkill for MVP scope (optimization premature for single-user)
- Additional infrastructure complexity
- Not needed until microservices extraction (Python/FastAPI service)

## Consequences

**Positive:**
- Rapid development with NestJS standard patterns (controllers, decorators, DTOs)
- OpenAPI/Swagger provides automatic API documentation and client SDKs
- Standard HTTP tooling works out-of-the-box (curl, Postman, browser fetch)
- Clear endpoint semantics: `POST /api/rag/query`, `GET /api/rag/entities`, `POST /api/rag/extract`
- Easy testing with standard HTTP libraries (supertest, jest)

**Negative:**
- Future streaming responses (LLM output tokens) require either Server-Sent Events (SSE) workaround or WebSocket upgrade
- Migration to GraphQL or gRPC later requires client code refactoring (2-6 months estimated cost)
- Over-fetching may occur if entity relationships grow complex (mitigated by pagination and DTO design)

**Neutral:**
- Authentication/authorization strategy deferred to post-MVP (currently single-user, no auth layer)
- Rate limiting planned for post-MVP phase (not critical for solo developer usage)

## References

- docs/adrs/mapping.md:616-628
- docs/decisoes-iniciais/entrevista-stack-rag-gdd-2026-01-29.md:32-56
- docs/decisoes-iniciais/entrevista-stack-rag-gdd-2026-01-29.md:48-50
