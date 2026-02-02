# ADR-001: PostgreSQL 16 as Unified Database Platform

**Status:** Accepted
**Date:** 2026-01-29

---

## Context and Problem Statement

The Sentinel/Daratrine project is a high-fidelity RAG system for narrative RPG Game Design Documents requiring integration of four distinct data paradigms: relational data (structured entities), knowledge graphs (narrative relationships with multi-hop reasoning), vector embeddings (semantic similarity search), and full-text search (keyword-based retrieval). The system targets single-user MVP deployment with strict cost constraints (under $100/month) while maintaining query latency under 500ms and preventing hallucinations through grounded retrieval.

The architectural challenge was selecting a database strategy that could support all four paradigms without introducing operational complexity, licensing costs, or vendor lock-in, while remaining viable for a solo developer with limited DevOps expertise.

## Decision Drivers

- Cost constraint of under $100/month total infrastructure spend for MVP
- Operational simplicity for single-user deployment with minimal maintenance overhead
- Need for cross-paradigm queries combining relational, graph, vector, and FTS data
- MVP validation philosophy requiring infrastructure that can be deployed and tested within weeks
- Expected dataset scale of approximately 2,400 graph vertices and 10,000-100,000 vector embeddings
- Clear migration path if scale exceeds PostgreSQL capabilities (50,000+ vertices)

## Considered Options

1. **PostgreSQL 16 + Apache AGE + pgvector + native FTS** (unified platform)
2. **Neo4j + Pinecone + PostgreSQL** (specialized best-of-breed stack)
3. **Neo4j + Qdrant + PostgreSQL** (self-hosted specialized stack)

## Decision Outcome

Chosen option: **PostgreSQL 16 with Apache AGE + pgvector + native FTS**, because it provides infrastructure unification with zero additional licensing costs, eliminates the complexity of managing multiple database systems, and delivers sufficient performance for the MVP scale (hundreds to low thousands of graph nodes). The decision prioritizes operational simplicity and cost optimization over maximum theoretical performance.

PostgreSQL serves as the single source of truth with:
- **Apache AGE extension** for Cypher-compatible knowledge graph queries
- **pgvector extension** with HNSW indexes (m=16, ef_construction=100) for vector similarity search
- **Native full-text search** with GIN indexes and `ts_rank_cd` ranking for keyword precision

This architecture supports cross-domain queries within single transactions and requires expertise in only one database platform.

## Pros and Cons of the Options

### PostgreSQL 16 + Apache AGE + pgvector + FTS

**Pros:**
- Zero licensing costs (all components are open-source extensions)
- Unified infrastructure eliminates multi-database synchronization complexity
- Cross-paradigm queries in single transactions (e.g., graph traversal filtered by vector similarity)
- Cypher query language compatibility via Apache AGE aligns with industry standards
- Clear migration path documented with specific scale triggers (50,000+ vertices → Neo4j)

**Cons:**
- Apache AGE graph performance inferior to native graph databases at massive scale (1M+ nodes)
- pgvector HNSW index performance degrades beyond 500k vectors compared to specialized vector databases
- Requires PostgreSQL expertise including extension management and advanced tuning
- AGE is a community extension with smaller ecosystem than Neo4j

### Neo4j + Pinecone + PostgreSQL

**Pros:**
- Best-in-class graph performance with Neo4j native graph engine
- Managed vector search with Pinecone eliminates infrastructure overhead
- Mature ecosystems with extensive documentation and tooling

**Cons:**
- Neo4j Enterprise licensing costs ($3,000-$10,000+ annually) or Neo4j Community edition limitations
- Pinecone pricing starts at $70/month, exceeding MVP budget constraint
- Operational complexity of managing three separate database systems
- Cross-paradigm queries require application-level data joining with increased latency

### Neo4j + Qdrant + PostgreSQL

**Pros:**
- Native graph database performance advantages
- Self-hosted Qdrant eliminates managed service costs
- Open-source stack with no vendor lock-in

**Cons:**
- Operational overhead of managing three database systems with separate backup/monitoring strategies
- Infrastructure complexity for solo developer exceeds MVP validation requirements
- Neo4j Community edition limitations (no clustering, limited scalability)
- Cross-paradigm queries still require multi-database coordination

## Consequences

**Positive:**
- Development velocity increases due to single database platform requiring one set of skills
- Infrastructure costs remain at $0 for database layer (only VPS hosting costs apply)
- Transactional consistency across all data paradigms simplifies application logic
- PostgreSQL ecosystem maturity provides extensive tooling for backup, monitoring, and optimization

**Negative:**
- Team must acquire specialized knowledge of Apache AGE Cypher implementation and pgvector tuning
- Graph query performance becomes a bottleneck if dataset exceeds 50,000 vertices (requires migration)
- Hybrid search optimization requires understanding of PostgreSQL query planner behavior across extensions

**Mitigation Strategy:**
- Document specific migration triggers: vertices > 50,000 → evaluate Neo4j migration
- Implement incremental deployment (3 phases over 4 weeks) to validate performance assumptions early
- Establish query performance baselines: graph queries <100ms, hybrid search <200ms, total RAG pipeline <500ms

**Future Path:**
If PostgreSQL limits are reached, the migration strategy is: extract graph module to Neo4j while maintaining pgvector for embeddings, preserving unified relational data layer in PostgreSQL. This preserves 70% of the investment while addressing the specific bottleneck.

## References

- docs/decisoes-iniciais/entrevista-stack-rag-gdd-2026-01-29.md:66-98
- docs/decisoes-iniciais/decisoes-arquiteturais-grafo.md:1-50
- docs/decisoes-iniciais/entrevista-busca-hibrida-2026-01-30.md:1-50
- CLAUDE.md:19-46
