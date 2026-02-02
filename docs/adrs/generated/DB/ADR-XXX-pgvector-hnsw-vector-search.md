# ADR-XXX: pgvector with HNSW for Semantic Vector Search

**Status:** Accepted
**Date:** 2026-01-30
**Related ADRs:** DB/ADR-001 (PostgreSQL Unified Database), SEARCH/ADR-001 (Hybrid Search Architecture), SEARCH/ADR-001 (HNSW Index Configuration)

---

## Context and Problem Statement

The Sentinel RAG system requires semantic search capabilities to retrieve relevant GDD content based on conceptual similarity rather than exact keyword matches. When users query narrative concepts like "conflicts between royal factions" or "character motivations in political intrigue," traditional keyword search fails to capture the semantic relationships embedded in the narrative text.

The architectural challenge was selecting a vector database technology that integrates seamlessly with the existing PostgreSQL unified database platform while supporting 900-2,400 text chunk embeddings (384 dimensions from Sentence-Transformers) within an 8GB RAM constraint. The solution must achieve 85-90% recall with sub-50ms latency while maintaining the zero-additional-cost infrastructure philosophy established for the MVP.

## Decision Drivers

- Architectural cohesion with PostgreSQL unified database platform established in Phase 1
- Zero additional licensing or infrastructure costs beyond PostgreSQL extensions
- Cross-domain query capability combining vector search with graph traversal and FTS in single transactions
- MVP scale of 10,000-100,000 vectors with clear migration path for larger datasets
- RAM budget constraint of 200-300MB for vector index within 8GB total system memory
- Development velocity requiring familiar PostgreSQL tooling rather than new database platforms

## Considered Options

1. **pgvector (PostgreSQL extension with HNSW index)** - unified platform approach
2. **Pinecone (managed cloud vector database)** - specialized managed service
3. **Qdrant (self-hosted vector database)** - specialized open-source solution

## Decision Outcome

Chosen option: **pgvector with HNSW indexing**, because it maintains architectural cohesion by extending the existing PostgreSQL platform rather than introducing a separate vector database system. This eliminates multi-database synchronization complexity, enables cross-paradigm queries within single transactions, and delivers zero additional infrastructure costs.

pgvector's HNSW index (configured with m=16, ef_construction=100, ef_search=40) provides sufficient performance for the MVP scale with 85-90% recall and sub-50ms latency. The conservative parameter baseline prioritizes RAM control and development velocity over maximum theoretical recall.

## Pros and Cons of the Options

### pgvector with HNSW

**Pros:**
- Zero licensing costs as open-source PostgreSQL extension
- Unified database platform eliminates synchronization and orchestration complexity
- Cross-domain queries combine vector similarity with SQL joins and graph traversals in single transactions
- PostgreSQL ecosystem tooling (backup, monitoring, replication) applies uniformly
- HNSW algorithm provides O(log N) query complexity enabling future scale to 100k+ vectors

**Cons:**
- Performance inferior to specialized vector databases at massive scale (500k+ vectors)
- HNSW parameter tuning requires understanding of graph-based ANN algorithms
- Community extension with smaller ecosystem compared to specialized vector databases
- Limited advanced filtering capabilities compared to Pinecone/Qdrant metadata filtering

### Pinecone

**Pros:**
- Managed service eliminates infrastructure and tuning overhead
- Production-grade performance and reliability with SLA guarantees
- Advanced metadata filtering and hybrid search built-in
- Automatic scaling and performance optimization

**Cons:**
- Pricing starts at $70/month, exceeding MVP budget constraint of $100/month total
- Vendor lock-in with proprietary API incompatible with open-source alternatives
- Requires separate database introducing multi-system synchronization complexity
- Network latency for external API calls adds 20-50ms to query path

### Qdrant

**Pros:**
- Self-hosted open-source eliminates managed service costs
- Superior vector search performance compared to pgvector at large scale
- Advanced filtering and payload support for complex queries
- Active development community and comprehensive documentation

**Cons:**
- Operational complexity of managing separate database system (deploy, backup, monitor)
- Docker Compose stack complexity increases for solo developer workflow
- Cross-domain queries require application-level coordination with PostgreSQL
- Infrastructure learning curve adds 2-4 weeks to MVP timeline

## Consequences

The pgvector decision consolidates all data paradigms (relational, graph, vector, full-text) into PostgreSQL, enabling the entire RAG pipeline to execute within a single database connection. This simplifies application code by eliminating multi-database transaction coordination and reduces infrastructure surface area to a single Docker Compose service.

Development velocity increases as the team maintains expertise in one database platform rather than learning multiple specialized systems. PostgreSQL's mature backup and monitoring tools extend to vector search without additional tooling investments.

The conservative HNSW baseline (m=16) accepts 85-90% recall instead of 95%+ to preserve RAM for other system components. If user feedback indicates missing relevant content, operators can increase `ef_search` at runtime (session-level parameter) without REINDEX operations. Dataset growth beyond 10,000 chunks requires REINDEX with higher `m` values, a documented scaling path with 2-8 week timeline.

Future migration to Qdrant becomes viable if vector count exceeds 500,000 or advanced filtering requirements emerge. The migration preserves application logic by maintaining the same embedding pipeline while swapping only the retrieval backend.

## References

- docs/decisoes-iniciais/entrevista-stack-rag-gdd-2026-01-29.md:82-98
- docs/decisoes-iniciais/entrevista-busca-hibrida-2026-01-30.md:225-267
- CLAUDE.md:30-47
