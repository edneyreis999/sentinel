# ADR-001: PostgreSQL as Unified Database with Apache AGE and pgvector Extensions

**Status:** Accepted
**Date:** 2026-01-29

---

## Context and Problem Statement

The Sentinel RAG system requires three distinct data capabilities: relational data management, graph traversal for narrative relationships, and vector similarity search for semantic embeddings. A traditional architecture would deploy separate specialized databases (Neo4j for graphs, Pinecone/Qdrant for vectors, PostgreSQL for relational data), creating operational complexity with multiple connection pools, distributed transactions, cross-database synchronization, and significantly higher infrastructure costs.

The core problem: How to support graphs, vectors, and relational data within a strict budget constraint (<$100/month) while maintaining operational simplicity for a single-developer MVP?

## Decision Drivers

- **Cost Constraint**: MVP budget target of <$100/month total infrastructure cost eliminates managed database services ($200+ monthly)
- **Operational Simplicity**: Single-developer team requires minimal operational overhead (one database, one backup strategy, one deployment)
- **Transactional Consistency**: RAG pipeline requires ACID guarantees across graph entities, embeddings, and metadata updates
- **Team Expertise**: Existing PostgreSQL knowledge reduces learning curve compared to adopting multiple specialized databases
- **Migration Path**: Need clear scaling triggers and migration strategy if performance becomes inadequate

## Considered Options

1. **PostgreSQL 16 with Apache AGE and pgvector extensions** (chosen)
2. **Multi-Database Architecture** (Neo4j + Pinecone/Qdrant + PostgreSQL)
3. **Graph-First Architecture** (Neo4j with plugin-based vector search)

## Decision Outcome

Chosen option: **PostgreSQL 16 with Apache AGE and pgvector extensions**, because it provides unified infrastructure with zero licensing costs, transactional consistency across all data paradigms, and operational simplicity aligned with single-developer constraints. The decision accepts performance trade-offs (slower than specialized databases at massive scale) in exchange for cost savings and reduced complexity, which are appropriate for MVP scope (thousands of nodes, <500k vectors).

The unified database approach eliminates multi-database orchestration complexity while maintaining adequate performance for target workloads (graph queries <100ms, vector search <50ms).

## Pros and Cons of the Options

### Option 1: PostgreSQL 16 with Apache AGE and pgvector

**Pros:**
- Zero licensing costs (vs $200+/month for managed services)
- Single connection pool and unified backup strategy
- ACID transactions across graphs, vectors, and relational data
- Team familiar with PostgreSQL operational patterns

**Cons:**
- Custom Docker image compilation required (AGE + pgvector from source)
- Slower graph traversal than Neo4j at massive scale (>1M nodes)
- agtype parsing complexity (custom vertex/edge types)
- Apache AGE has smaller community and fewer examples than Neo4j

### Option 2: Multi-Database Architecture (Neo4j + Pinecone + PostgreSQL)

**Pros:**
- Best-in-class performance for each paradigm
- Mature tooling and extensive community support
- Independent scaling of graph vs vector workloads

**Cons:**
- Infrastructure cost exceeds budget ($200+/month for managed services)
- Complex orchestration with three connection pools
- Distributed transaction challenges across databases
- Triple operational overhead (backups, monitoring, deployments)

### Option 3: Graph-First Architecture (Neo4j with vector plugin)

**Pros:**
- Superior graph performance and mature Cypher ecosystem
- Unified graph + vector queries through Neo4j GDS

**Cons:**
- Neo4j managed service cost ($200+/month) or complex self-hosting
- Vector search capabilities less mature than dedicated solutions
- Still requires separate PostgreSQL for relational data

## Consequences

**Positive:**
- Foundational cost savings enable entire MVP to stay within budget
- Single database deployment simplifies VPS infrastructure
- Unified query patterns reduce cognitive load for development
- Transactional consistency prevents data synchronization bugs

**Negative:**
- Self-hosting requirement (cloud-managed Postgres incompatible with custom AGE compilation)
- Team must learn Cypher query language and vector search optimization
- Performance ceiling defined by PostgreSQL extensions rather than specialized databases
- Custom Docker image adds deployment friction and maintenance burden

**Migration Triggers Identified:**
- Vector search latency >500ms P95 with >500k vectors → migrate to Qdrant
- Graph traversal inadequate with >1M nodes → migrate to Neo4j
- Need for advanced graph algorithms unavailable in Apache AGE

## References

- docs/decisoes-iniciais/entrevista-stack-rag-gdd-2026-01-29.md:64-95
- docs/decisoes-iniciais/decisoes-arquiteturais-grafo.md:1-297
- docs/adrs/mapping.md:171-213
