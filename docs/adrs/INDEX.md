# ADR Index - Sentinel (Daratrine)

**Total ADRs:** 32
**Last Updated:** 2026-02-01

## Overview

This index organizes all Architecture Decision Records (ADRs) for the Sentinel project - a high-fidelity RAG system for narrative RPG Game Design Documents (GDDs).

---

## ADRs by Module

### API Module (2 ADRs)

| ID | Title | Status |
|----|-------|--------|
| [ADR-001](generated/API/ADR-001-rest-api-protocol.md) | REST API Protocol | Superseded by ADR-002 |
| [ADR-002](API/ADR-002-graphql-api-with-apollo-server-5.md) | GraphQL API with Apollo Server 5 | Accepted |

### ARCH Module (1 ADR)

| ID | Title | Status |
|----|-------|--------|
| [ADR-001](ARCH/ADR-001-clean-architecture-with-ddd-patterns.md) | Clean Architecture with DDD Patterns | Accepted |

### DB Module (6 ADRs)

| ID | Title | Status |
|----|-------|--------|
| [ADR-001](generated/DB/ADR-001-postgresql-unified-database-strategy.md) | PostgreSQL Unified Database Strategy | Accepted |
| [ADR-001](generated/DB/ADR-001-postgresql-unified-database-with-age-and-pgvector.md) | PostgreSQL Unified Database with AGE and pgvector | Accepted |
| [ADR-002](generated/DB/ADR-002-apache-age-cypher-integration-strategy.md) | Apache AGE Cypher Integration Strategy | Accepted |
| [ADR-003](generated/DB/ADR-003-postgresql-full-text-search-ts-rank-cd.md) | PostgreSQL Full-Text Search with ts_rank_cd | Accepted |
| [ADR-XXX](generated/DB/ADR-XXX-pgvector-hnsw-vector-search.md) | pgvector HNSW Vector Search | Accepted |

### DI Module (1 ADR)

| ID | Title | Status |
|----|-------|--------|
| [ADR-001](DI/ADR-001-symbol-based-di-tokens.md) | Symbol-based DI Tokens for NestJS | Accepted |

### DOCS Module (3 ADRs)

| ID | Title | Status |
|----|-------|--------|
| [ADR-001](generated/DOCS/ADR-001-documentation-driven-development-approach.md) | Documentation-Driven Development Approach | Accepted |
| [ADR-002](generated/DOCS/ADR-002-three-phase-incremental-implementation-strategy.md) | Three-Phase Incremental Implementation Strategy | Accepted |
| [ADR-XXX](generated/DOCS/ADR-XXX-interview-based-decision-methodology.md) | Interview-Based Decision Methodology | Accepted |

### GRAPH Module (3 ADRs)

| ID | Title | Status |
|----|-------|--------|
| [ADR-001](generated/GRAPH/ADR-001-apache-age-graph-database-extension.md) | Apache AGE Graph Database Extension | Accepted |
| [ADR-002](generated/GRAPH/ADR-002-template-based-cypher-generation.md) | Template-Based Cypher Generation | Accepted |
| [ADR-002](generated/GRAPH/ADR-002-15-label-narrative-ontology-schema-v3.md) | 15-Label Narrative Ontology Schema v3 | Accepted |

### INFRA Module (3 ADRs)

| ID | Title | Status |
|----|-------|--------|
| [ADR-001](generated/INFRA/ADR-001-custom-postgresql-docker-image-compiled-extensions.md) | Custom PostgreSQL Docker Image with Compiled Extensions | Accepted |
| [ADR-XXX](generated/INFRA/ADR-XXX-vps-deployment-traditional-server.md) | VPS Deployment - Traditional Server | Accepted |
| [ADR-XXX](generated/INFRA/ADR-XXX-docker-compose-orchestration-for-development-and-production.md) | Docker Compose Orchestration for Development and Production | Accepted |

### LLM Module (4 ADRs)

| ID | Title | Status |
|----|-------|--------|
| [ADR-001](generated/LLM/ADR-001-claude-3-5-sonnet-primary-llm.md) | Claude 3.5 Sonnet as Primary LLM | Accepted |
| [ADR-001](generated/LLM/ADR-001-huggingface-sentence-transformers-embeddings.md) | HuggingFace Sentence Transformers for Embeddings | Accepted |
| [ADR-002](generated/LLM/ADR-002-claude-pro-plan-cost-optimization.md) | Claude Pro Plan for Cost Optimization | Accepted |
| [ADR-002](generated/LLM/ADR-002-hybrid-prompt-template-graph-metadata-chunks.md) | Hybrid Prompt Template: Graph Metadata + Chunks | Accepted |

### ORM Module (1 ADR)

| ID | Title | Status |
|----|-------|--------|
| [ADR-001](ORM/ADR-001-prisma-7-with-sqlite.md) | Prisma 7 with SQLite for Local Storage | Accepted |

### RAG Module (1 ADR)

| ID | Title | Status |
|----|-------|--------|
| [ADR-001](generated/RAG/ADR-001-nestjs-monolithic-architecture.md) | NestJS Monolithic Architecture | Accepted |

### SEARCH Module (4 ADRs)

| ID | Title | Status |
|----|-------|--------|
| [ADR-001](generated/SEARCH/ADR-001-hybrid-search-architecture-pgvector-fts-rrf.md) | Hybrid Search Architecture: pgvector + FTS + RRF | Accepted |
| [ADR-001](generated/SEARCH/ADR-001-hnsw-index-configuration.md) | HNSW Index Configuration | Accepted |
| [ADR-002](generated/SEARCH/ADR-002-reciprocal-rank-fusion-rrf-algorithm.md) | Reciprocal Rank Fusion (RRF) Algorithm | Accepted |
| [ADR-002](generated/SEARCH/ADR-002-2-stage-subgraph-extraction-fts-embedding-fallback.md) | 2-Stage Subgraph Extraction: FTS + Embedding Fallback | Accepted |

### STATE Module (1 ADR)

| ID | Title | Status |
|----|-------|--------|
| [ADR-001](STATE/ADR-001-state-machine-pattern-for-status-transitions.md) | State Machine Pattern for Status Transitions | Accepted |

### TEST Module (1 ADR)

| ID | Title | Status |
|----|-------|--------|
| [ADR-001](TEST/ADR-001-fakebuilder-with-proporfactory-pattern.md) | FakeBuilder with PropOrFactory Pattern | Accepted |

### VAL Module (1 ADR)

| ID | Title | Status |
|----|-------|--------|
| [ADR-001](VAL/ADR-001-zod-4-validation-with-openapi.md) | Zod 4 for Runtime Validation with OpenAPI | Accepted |

---

## Summary by Module

| Module | Total ADRs | Key Focus Areas |
|--------|-----------|-----------------|
| API | 2 | GraphQL API with Apollo Server 5 |
| ARCH | 1 | Clean Architecture with DDD patterns |
| DB | 6 | PostgreSQL, Apache AGE, pgvector, FTS |
| DI | 1 | Symbol-based DI tokens |
| DOCS | 3 | Documentation process and methodology |
| GRAPH | 3 | Graph database, Cypher, Ontology schema |
| INFRA | 3 | Docker, VPS deployment |
| LLM | 4 | Claude models, embeddings, prompts |
| ORM | 1 | Prisma 7 with SQLite |
| RAG | 1 | NestJS architecture |
| SEARCH | 4 | Hybrid search, HNSW, RRF |
| STATE | 1 | State Machine pattern |
| TEST | 1 | FakeBuilder pattern |
| VAL | 1 | Zod 4 validation |
| **TOTAL** | **32** | **All architectural decisions** |

---

## Key Cross-References

### High-Impact Decision Chains

1. **Backend Architecture Foundation**:
   - ARCH-001 (Clean Architecture with DDD) → RAG-001 (NestJS Monolithic)
   - ARCH-001 establishes internal layer organization (Domain, Application, Infrastructure, Nest-Modules)
   - DI-001 (Symbol-based tokens) enforces Dependency Inversion Principle
   - Rationale: Strong isolation between business logic and frameworks enables testing and future microservices extraction

2. **API Protocol Evolution**:
   - API-001 (REST) → API-002 (GraphQL with Apollo Server 5)
   - API-002 introduces real-time subscriptions via PubSub pattern
   - VAL-001 (Zod 4) provides runtime validation for GraphQL inputs
   - Rationale: GraphQL eliminates over-fetching and provides built-in real-time capabilities

3. **Local vs Remote Data Storage**:
   - ORM-001 (Prisma 7 + SQLite) for local Electron backend
   - DB-001 (PostgreSQL + AGE + pgvector) for remote RAG server
   - Rationale: Appropriate technology choices for each operational context (embedded vs distributed)

4. **Database Foundation (Remote)**:
   - DB-001 (PostgreSQL Unified) → DB-002 (Apache AGE Cypher) → GRAPH-001 (Apache AGE)
   - DB-001 (PostgreSQL + AGE + pgvector) → DB-XXX (pgvector HNSW) → SEARCH-001 (Hybrid Search)
   - Rationale: Single PostgreSQL database with graph and vector extensions simplifies infrastructure

5. **Search Architecture**:
   - SEARCH-001 (Hybrid Search: pgvector + FTS + RRF) → SEARCH-002 (RRF Algorithm)
   - DB-003 (PostgreSQL FTS) → SEARCH-002 (2-Stage Subgraph Extraction)
   - Rationale: Combining semantic and keyword search with rank fusion improves retrieval quality

6. **Graph & Ontology**:
   - GRAPH-001 (Apache AGE) → GRAPH-002 (Template-Based Cypher) → GRAPH-002 (15-Label Ontology)
   - LLM-002 (Hybrid Prompt Template) incorporates graph metadata
   - Rationale: Rich narrative ontology enables context-aware retrieval

7. **LLM & Embeddings**:
   - LLM-001 (Claude 3.5 Sonnet) → LLM-002 (Cost Optimization)
   - LLM-001 (Sentence Transformers) → SEARCH-001 (Hybrid Search)
   - Rationale: High-quality embeddings and primary LLM choice drive system quality

8. **Testing & Quality**:
   - TEST-001 (FakeBuilder with PropOrFactory) reduces test boilerplate
   - VAL-001 (Zod 4) provides runtime type safety
   - STATE-001 (State Machine) enables isolated unit testing of domain logic
   - Rationale: Testable domain logic through pure TypeScript without framework dependencies

9. **Infrastructure**:
   - INFRA-001 (Custom PostgreSQL Docker Image) → INFRA-XXX (Docker Compose)
   - DB-001 (Unified Database) → INFRA-001 (Compiled Extensions)
   - Rationale: Docker with pre-compiled extensions ensures consistent environments

---

## Navigation

- **Source Documentation**: See `docs/CLAUDE.md` for full documentation guide
- **Initial Decisions**: See `docs/decisoes-iniciais/` for pre-ADRS architectural decisions
- **Tech Research**: See `docs/pesquisas/` for research backing these decisions
- **Potential ADRs Archive**: See `docs/adrs/potential-adrs/done/`

---

## ADR Lifecycle

All ADRs currently have **Status: Accepted** as they were created during the initial architectural design phase. As the project evolves:

- **Superseded**: ADRs replaced by newer decisions will be marked as superseded with references
- **Deprecated**: ADRs for removed features will be marked as deprecated
- **Amended**: Significant changes will create new ADRs that amend (not replace) existing ones

---

## ADR Creation Process

**DO NOT manually create ADR files.** Use the agent-based workflow:

1. Create potential ADR: `docs/adrs/potential-adrs/must-document/{MODULE}/{name}.md`
2. Run skill: `/adr-generate {MODULE}`
3. Agent generates: `docs/adrs/generated/{MODULE}/ADR-XXX-{name}.md` (auto-archives source to `done/`)
4. Renumber XXX to next sequential ID, move to `docs/adrs/{MODULE}/ADR-{N}-{name}.md`
5. Update this `INDEX.md`
