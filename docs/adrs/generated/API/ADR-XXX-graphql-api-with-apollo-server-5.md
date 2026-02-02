# ADR-XXX: GraphQL API with Apollo Server 5

**Status:** Accepted
**Date:** 2026-01-26
**Supersedes:** ADR-001

---

## Context and Problem Statement

The Sentinel backend requires a flexible API for the Electron main process to consume. REST APIs can lead to over-fetching or under-fetching data, particularly for complex nested queries common in narrative RPG Game Design Documents. The project needs real-time capabilities for simulation status updates, which REST protocols do not support natively without additional infrastructure.

Apollo Server 4 reaches End-of-Life on 2026-01-26, making Apollo Server 5 the current stable release. This timing creates a natural migration point for evaluating the API protocol strategy as the system evolves beyond initial MVP validation.

The decision represents a strategic evolution from the initial REST-only approach (ADR-001), driven by emerging requirements for real-time subscriptions and more efficient data fetching patterns for complex GDD structures.

## Decision Drivers

- Need for real-time updates via WebSocket subscriptions (simulation status, preference changes)
- Elimination of over-fetching and under-fetching in complex nested entity queries
- Type-safe API contract with TypeScript-first development approach
- Self-documenting API through GraphQL schema and Apollo Sandbox
- Alignment with Apollo Server 5 as current stable release (Apollo Server 4 EOL: 2026-01-26)
- Single endpoint for all operations reducing client complexity

## Considered Options

1. **GraphQL with Apollo Server 5** (Chosen)
2. **REST API** (Previous choice - ADR-001)
3. **tRPC** (TypeScript-specific RPC)

## Decision Outcome

Chosen option: **GraphQL with Apollo Server 5**, because it provides built-in real-time subscriptions, eliminates over-fetching through flexible queries, and offers superior TypeScript integration with NestJS GraphQL. The migration from REST is timed with Apollo Server 4 EOL (2026-01-26), providing natural upgrade momentum.

GraphQL implementation uses Apollo Server 5.3.0 with @nestjs/graphql@^12.2.0, supporting queries (data retrieval), mutations (data modifications), and subscriptions (real-time updates via graphql-ws@^6.0.0 WebSocket). The PubSub pattern enables event-driven subscriptions for simulation status, user preferences, and history changes.

## Pros and Cons of the Options

### GraphQL with Apollo Server 5

**Pros:**
- Clients request exactly the data needed (no over-fetching or under-fetching)
- Type-safe schema with TypeScript provides compile-time validation
- Real-time subscriptions built-in via WebSocket (simulationStatusChanged, userPreferencesChanged)
- Self-documenting API with GraphQL schema and Apollo Sandbox explorer
- Single endpoint simplifies client configuration

**Cons:**
- More complex than REST for simple CRUD operations
- Caching requires additional setup (DataLoader pattern for N+1 prevention)
- Steeper initial learning curve for developers unfamiliar with GraphQL
- Requires careful schema design to avoid query complexity abuse

### REST API

**Pros:**
- Simpler implementation for basic CRUD operations
- Ubiquitous understanding and standard HTTP tooling
- Built-in caching semantics with HTTP headers
- Stateless design aligns with request-response patterns

**Cons:**
- Over-fetching or under-fetching data in complex nested queries
- No native real-time support (requires WebSocket infrastructure separately)
- Multiple endpoints increase client complexity
- Less flexible for varying client data requirements

### tRPC

**Pros:**
- End-to-end type safety without code generation
- TypeScript-first design with minimal boilerplate
- Auto-completion across client-server boundary

**Cons:**
- Requires shared TypeScript types between frontend and backend
- Tightly couples client and server to TypeScript ecosystem
- Less flexible for non-TypeScript clients
- Limited ecosystem compared to Apollo GraphQL

## Consequences

**Positive:**
- Real-time subscriptions enable instant UI updates for simulation status and preference changes without polling
- Flexible query capabilities allow Electron client to fetch exactly the GDD data needed for each view
- Strong typing between frontend and backend reduces runtime errors
- Apollo Sandbox provides interactive API documentation for development
- Single endpoint simplifies authentication and rate limiting implementation

**Negative:**
- Increased complexity for simple operations compared to REST
- Need to implement DataLoader pattern to prevent N+1 queries on nested entity relationships
- Migration requires refactoring existing REST clients to GraphQL queries
- Subscription scalability requires careful PubSub implementation (in-memory for single-user, Redis for multi-tenant future)

**Operational Impact:**
- Schema-first development workflow requires GraphQL SDL maintenance alongside TypeScript code
- Apollo Server 5 migration requires updating resolvers from Apollo Server 4 patterns
- WebSocket connections need connection management and reconnection logic
- GraphQL query complexity analysis needed to prevent abusive queries

## References

- docs/adrs/generated/API/ADR-001-rest-api-protocol.md
- planos/001-kick-start/epico-kickstart.md
