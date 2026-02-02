# ADR-001: NestJS Monolithic Architecture for RAG Pipeline

**Status:** Accepted
**Date:** 2026-01-29
**Related ADRs:** DB/ADR-001 (PostgreSQL Unified Database Strategy)

---

## Context and Problem Statement

The Sentinel RAG system requires integration of multiple technical capabilities: knowledge graph queries via Apache AGE, vector similarity search with pgvector, full-text search, LLM orchestration with Claude 3.5 Sonnet, and embedding generation through HuggingFace APIs. The architectural challenge was determining how to structure these components—as independent microservices optimized for specific workloads, or as a unified application prioritizing operational simplicity.

The project operates under strict constraints: single-user MVP deployment, infrastructure budget under $100/month, and a philosophy of validation-before-optimization. The team needed an architecture that enables rapid iteration and hypothesis testing without premature commitment to distributed systems complexity.

## Decision Drivers

- Rapid validation of GraphRAG value proposition before architectural investment
- Infrastructure cost target of $10-40/month VPS deployment versus $200+ microservices infrastructure
- Iteration speed prioritized over independent component scaling for MVP phase
- Solo developer context where microservices organizational benefits are irrelevant
- Query performance baseline requirement of sub-500ms total latency excluding LLM inference
- Clear evolution path needed when scaling triggers are reached

## Considered Options

1. **Monolithic NestJS application** (all components in single process)
2. **Microservices with NestJS BFF + Python/FastAPI AI module** (polyglot optimization)
3. **Serverless architecture with AWS Lambda** (auto-scaling pay-per-invocation)

## Decision Outcome

Chosen option: **Monolithic NestJS application**, because it minimizes operational complexity, maximizes iteration speed, and establishes a performance ceiling (zero inter-component latency) against which future architectures can be measured. The decision explicitly applies YAGNI principles—deferring microservices complexity until concrete evidence demonstrates monolithic bottlenecks.

The architecture consolidates all RAG pipeline stages (embedding generation, hybrid search, subgraph extraction, LLM orchestration) into a single NestJS application with in-process TypeScript method calls. Module isolation is enforced through dependency injection boundaries rather than network separation, with the `gdd-rag` module explicitly configured with zero exports to prevent unintentional coupling.

Migration triggers are pre-documented: embedding API latency exceeding 500ms P95, requirement for local ML models necessitating Python ecosystem access, or multi-user concurrency exceeding 10 simultaneous queries.

## Pros and Cons of the Options

### Monolithic NestJS Application

**Pros:**
- Zero inter-component network latency (in-process method calls)
- Single deployment artifact simplifies VPS deployment to git pull and process restart
- Unified error handling and logging context across entire pipeline
- Shared connection pools for PostgreSQL reduce resource overhead
- Simple local development environment with single npm start command

**Cons:**
- All components share single runtime environment (memory leak affects entire system)
- Cannot independently scale LLM-heavy components without scaling entire application
- Python ML ecosystem inaccessible without subprocess complexity
- Tight coupling risk if module boundaries lack discipline

### Microservices with NestJS BFF + Python/FastAPI

**Pros:**
- Independent scaling of compute-intensive embedding and LLM services
- Python ecosystem access for advanced ML libraries (ColBERT, cross-encoders)
- Polyglot optimization matching tools to workload characteristics
- Physical separation enforces module boundaries

**Cons:**
- Infrastructure complexity requires service discovery, distributed tracing, network failure handling
- Inter-service latency adds 10-50ms overhead per call versus in-process
- Operational cost increases to $200+ for container orchestration and monitoring
- Debugging distributed failures significantly harder than monolithic stack traces

### Serverless Architecture

**Pros:**
- Automatic scaling with pay-per-invocation cost model
- Zero infrastructure management overhead

**Cons:**
- Cold start latency incompatible with sub-500ms query targets
- PostgreSQL connection pooling challenges with ephemeral Lambda instances
- GraphRAG requires warm runtime context for efficient query execution
- Vendor lock-in risk with AWS-specific patterns

## Consequences

**Operational Benefits**: Single VPS deployment reduces infrastructure to one Docker container, one PM2 process, and one health check endpoint. Monitoring and debugging operate within unified logging context. Development workflow requires expertise in single platform (NestJS) rather than polyglot orchestration.

**Performance Baseline**: In-process communication establishes maximum achievable performance. Any future migration to distributed architecture will add latency, making current monolith the performance ceiling for comparison.

**Modularity Discipline Required**: Success depends on maintaining clear boundaries through code patterns (Repository pattern, isolated modules, dependency injection) rather than physical separation. Team must resist convenience of cross-module coupling.

**Migration Path Clarity**: Documented triggers prevent indefinite monolith stasis. When embedding API latency exceeds 500ms P95, the `gdd-rag` module extracts to Python/FastAPI service with gRPC communication, preserving NestJS as BFF layer. This path is explicitly designed rather than reactive crisis response.

## References

- `docs/decisoes-iniciais/entrevista-stack-rag-gdd-2026-01-29.md:30-56` (Architectural decision rationale)
- `docs/adrs/mapping.md:389-448` (RAG Pipeline module structure)
- `CLAUDE.md:31-56` (Migration triggers documentation)
- `docs/decisoes-iniciais/entrevista-busca-hibrida-2026-01-30.md` (Hybrid search integration)
