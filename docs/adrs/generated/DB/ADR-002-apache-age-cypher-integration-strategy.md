# ADR-002: Apache AGE Cypher Integration with Template-Based Query Strategy

**Status:** Accepted
**Date:** 2026-01-29
**Related ADRs:** ADR-001 (PostgreSQL Unified Database)

---

## Context and Problem Statement

The Sentinel RAG system uses Apache AGE as a PostgreSQL extension to enable Cypher-based graph queries over narrative ontology. However, Apache AGE introduces integration challenges: the proprietary `agtype` data format requires custom parsing, SQL-Cypher hybrid queries create complexity, and the team has no prior AGE experience. The system needs a reliable, maintainable approach to generate and execute Cypher queries while meeting strict performance targets (<100ms for basic queries, <500ms for RAG pipeline).

How should the system generate Cypher queries and integrate Apache AGE with the NestJS TypeScript codebase to ensure reliability, performance, and maintainability during incremental MVP development?

## Decision Drivers

- Reliability requirement: 100% query success rate for production Cypher queries to prevent RAG pipeline failures
- Performance target: <100ms basic graph queries, minimal query generation latency overhead
- MVP-first philosophy: Cover 80% of initial use cases with simple, proven solutions
- Team learning curve: First experience with Apache AGE, Cypher syntax, and agtype parsing
- Template reusability: Support incremental implementation across 3 development phases (15 labels, 26 relationship types)
- Migration readiness: Ensure Cypher queries remain portable if future Neo4j migration becomes necessary

## Considered Options

1. Template-based Cypher with parameterized placeholders (chosen)
2. Dynamic Cypher generation via LLM
3. Hybrid approach with LLM auto-correction

## Decision Outcome

Chosen option: **Template-based Cypher with fixed parameterized queries**, because it provides 100% reliability through pre-tested queries, minimal latency (LLM only extracts parameters, not full queries), and covers 80% of MVP use cases with proven patterns.

The approach uses TypeScript template constants where Cypher queries are pre-written with placeholders, and Claude 3.5 Sonnet extracts only parameters from natural language. This trades dynamic flexibility for guaranteed correctness and predictable performance, appropriate for MVP validation before investing in complex dynamic generation.

## Pros and Cons of the Options

### Template-based Cypher (Parameterized)

- **Good**: 100% reliability - queries are pre-tested and validated before deployment
- **Good**: Minimal latency overhead - LLM only extracts parameters, not generates Cypher syntax
- **Good**: Covers 80% of MVP queries with proven patterns for 15 entity labels
- **Bad**: Limited flexibility - new query patterns require developer implementation of new templates
- **Bad**: Template maintenance overhead as schema evolves through 3 implementation phases

### Dynamic Cypher Generation (LLM)

- **Good**: Maximum flexibility - handles arbitrary natural language queries without predefined templates
- **Good**: No template maintenance - adapts automatically to schema changes
- **Bad**: Unreliable - LLM can generate invalid Cypher syntax causing pipeline failures
- **Bad**: High latency - requires full query generation + validation on every request
- **Bad**: Debugging complexity - production errors difficult to trace to specific queries

### Hybrid with Auto-Correction

- **Good**: Balances flexibility and reliability through error recovery mechanisms
- **Bad**: Complex implementation - requires error detection, retry logic, and fallback strategies
- **Bad**: Unpredictable latency - correction loops can add 200-500ms per failed attempt
- **Bad**: Over-engineering for MVP - complexity unjustified before validating core value proposition

## Consequences

**Positive**:
- Template library covering 15 entity labels and 26 relationship types achieves <50ms query generation latency
- Integration with NestJS Repository Pattern through pre-validated TypeScript constants enables type-safe graph access
- Incremental template expansion across 3 phases (core narrative → quests → gameplay mechanics) reduces implementation risk
- Cypher portability preserved if future Neo4j migration required (templates translate directly)

**Negative**:
- New query patterns require developer intervention rather than automatic adaptation
- Template versioning needed as graph schema evolves from v3 through future iterations
- 20% of edge-case queries may require dynamic generation fallback mechanism in post-MVP phases

**Neutral**:
- Custom agtype parser implementation required in TypeScript for vertex/edge/path data structures regardless of query generation approach

## References

- docs/decisoes-iniciais/decisoes-arquiteturais-grafo.md:57-103
- docs/decisoes-iniciais/decisoes-arquiteturais-grafo.md:187-213
- CLAUDE.md:30-47
