# ADR-001: Apache AGE as Graph Database Extension for PostgreSQL 16

**Status:** Accepted
**Date:** 2026-01-29

---

## Context and Problem Statement

The Sentinel project requires modeling complex narrative relationships for RPG Game Design Documents, including characters, factions, locations, events, and quests across 15 entity types and 26 relationship types. Traditional relational modeling is inadequate for multi-hop reasoning over these interconnected narrative elements, which is essential for preventing hallucinations in the RAG system's LLM responses.

The system needs graph database capabilities to enable traversal queries like "find all characters in a faction affected by an event" while maintaining ACID transactions, coexisting with vector embeddings (pgvector) and relational data in a unified database architecture. The solution must align with the <$100/month MVP budget constraint and support incremental implementation across 3 development phases.

## Decision Drivers

- Cost constraint: <$100/month for MVP infrastructure with zero licensing fees
- Unified database architecture: Single PostgreSQL instance for relational, vector, and graph data with integrated transactions
- Performance requirement: <100ms for basic graph queries on MVP scale (<10k vertices)
- Operational simplicity: Avoid data synchronization overhead and dual-database management complexity
- Cypher compatibility: Industry-standard query language for graph traversal with template-based approach
- Migration path: Clear upgrade triggers if graph scale exceeds PostgreSQL sweet spot (>10k vertices)

## Considered Options

1. Apache AGE (PostgreSQL extension)
2. Neo4j (dedicated graph database)
3. Memgraph (dedicated graph database)

## Decision Outcome

Chosen option: **Apache AGE as PostgreSQL 16 extension**, because it provides Cypher-compatible graph queries directly within PostgreSQL, enabling unified database architecture with zero licensing costs and ACID-guaranteed transactions across relational, vector, and graph data.

This aligns with the MVP-first incremental implementation strategy and <$100/month budget constraint. The trade-off accepts inferior performance at massive scale (millions of nodes) in exchange for operational simplicity and cost efficiency at the project's target scale (<10k vertices, ~2.4k expected in MVP).

## Pros and Cons of the Options

### Apache AGE (PostgreSQL extension)

- **Good**: Zero licensing costs (open-source Apache 2.0 license)
- **Good**: Unified database eliminates data synchronization overhead and dual-database management
- **Good**: ACID transactions across relational, vector (pgvector), and graph data
- **Good**: Adequate performance for medium-scale graphs (<10k vertices, <100ms queries)
- **Bad**: Inferior performance compared to Neo4j/Memgraph at massive scale (millions of nodes)
- **Bad**: Custom Docker image compilation required (multi-stage build complexity)
- **Bad**: TypeScript parser needed for `agtype` data type handling

### Neo4j (dedicated graph database)

- **Good**: Superior performance for massive graphs (millions of nodes, optimized graph algorithms)
- **Good**: Mature ecosystem with extensive documentation and tooling
- **Good**: Native Cypher implementation with advanced query optimization
- **Bad**: Commercial licensing costs unknown, conflicts with <$100/month budget
- **Bad**: Separate database requires data synchronization between relational and graph data
- **Bad**: Operational complexity of managing two database systems
- **Bad**: ACID transactions across relational and graph data require distributed transaction coordination

### Memgraph (dedicated graph database)

- **Good**: High performance for large graphs with in-memory architecture
- **Good**: Cypher-compatible with active development community
- **Bad**: Licensing concerns similar to Neo4j for commercial use
- **Bad**: Less mature PostgreSQL ecosystem integration compared to Apache AGE
- **Bad**: Same operational complexity as Neo4j (dual-database management, data synchronization)

## Consequences

**Positive**:
- Infrastructure cost remains <$50/month (PostgreSQL self-hosted + VPS), enabling <$100/month total budget
- Simplified deployment with single Docker container (PostgreSQL + AGE + pgvector)
- Template-based Cypher queries achieve 100% reliability and minimal latency for 80% of MVP queries
- Graph-enhanced RAG pipeline can execute integrated queries combining vector search, FTS, and graph traversal in <500ms

**Negative**:
- Migration to Neo4j/Memgraph required if graph exceeds 10k vertices (trigger defined at 50k vertices)
- Custom Docker image maintenance overhead (PostgreSQL + AGE compilation, version compatibility testing)
- Team learning curve for Cypher query language, `agtype` parsing, and graph modeling patterns (15 labels, 26 relationships)

**Neutral**:
- Performance tuning specific to graph workloads within PostgreSQL (shared_buffers, work_mem, GIN/BTree indexes on graph properties)

## References

- docs/decisoes-iniciais/decisoes-arquiteturais-grafo.md:1-1462
- docs/pesquisas/Grafos de Conhecimento RPG_ Implementação e Performance.md:1-256
- docs/decisoes-iniciais/labels-arestas-v3.md:1-874
