# ADR-003: PostgreSQL Native Full-Text Search with ts_rank_cd

**Status:** Accepted
**Date:** 2026-01-30
**Related ADRs:** ADR-001, SEARCH/ADR-001

---

## Context and Problem Statement

The Sentinel RAG system requires high-precision keyword matching for technical terms, proper nouns (character names, faction names, location names), and domain-specific RPG terminology within 900-2,400 text chunks. While vector embeddings provide semantic similarity, they struggle with exact matching of specific names and out-of-vocabulary terms critical in narrative GDD queries.

The challenge: How to implement lexical search with keyword precision while maintaining operational simplicity (zero additional infrastructure), staying within budget constraints (<$100/month), and achieving retrieval latency under 50ms as part of the hybrid search pipeline?

## Decision Drivers

- Operational simplicity aligned with MVP-first philosophy (built-in vs external dependencies)
- Integration with existing PostgreSQL infrastructure (same database as AGE graphs and pgvector)
- Adequate performance for 2,400 chunks with <5% quality gap vs industry-standard BM25
- Field weighting support for section-based chunking strategy (boost section names over content)
- Reversible migration path if lexical precision proves insufficient
- Portuguese language optimization for narrative content

## Considered Options

1. **PostgreSQL native Full-Text Search with ts_rank_cd** (chosen)
2. BM25 ranking via pg_search extension
3. Elasticsearch dedicated keyword search service

## Decision Outcome

Chosen option: **PostgreSQL native Full-Text Search with ts_rank_cd**, because it provides built-in functionality with zero configuration overhead, adequate ranking performance for MVP scale (2,400 chunks), and seamless integration with the unified PostgreSQL database strategy. The ts_rank_cd algorithm uses cover density ranking (considers proximity and clustering of keyword matches) which is superior to simple frequency-based ranking for narrative text.

The decision accepts a marginal performance gap (<5% NDCG) compared to BM25 in exchange for operational simplicity. Migration to pg_search extension remains a reversible 1-2 week operation if future testing reveals insufficient lexical precision.

## Pros and Cons of the Options

### PostgreSQL Native FTS with ts_rank_cd

**Pros:**
- Zero additional dependencies or Docker configuration
- Cover density ranking captures phrase proximity in narrative text
- Native integration with GIN indexes and tsvector columns
- Field weighting support through setweight() function
- Portuguese stemming and unaccent built-in for language optimization

**Cons:**
- Performance ~5% lower NDCG than BM25 on benchmark datasets
- Fewer tuning parameters compared to specialized BM25 implementations
- Cover density algorithm less documented than BM25

### BM25 via pg_search Extension

**Pros:**
- Industry-standard ranking algorithm with proven performance
- ~5% higher NDCG scores on information retrieval benchmarks
- Extensive tuning parameters (k1, b) for optimization

**Cons:**
- Requires additional pg_search extension installation in Dockerfile
- Increased operational complexity for marginal quality improvement at MVP scale
- Configuration overhead not justified for 2,400 chunk corpus

### Elasticsearch Dedicated Service

**Pros:**
- Best-in-class keyword search with advanced analyzers
- Rich query DSL and aggregation capabilities
- Proven scalability for millions of documents

**Cons:**
- Doubles infrastructure complexity (requires separate service orchestration)
- Hosting costs exceed budget ($50-100/month for managed service)
- Data synchronization overhead between PostgreSQL and Elasticsearch
- Network latency adds 30-50ms to query path

## Consequences

The FTS implementation uses GIN indexes on generated tsvector columns with field weighting (section names weight A, chunk text weight B). This aligns with the semantic chunking strategy where section metadata provides structural signals for ranking.

Portuguese optimization through unaccent and portuguese_stem dictionary handles accented characters and morphological variations common in narrative content. A custom synonym dictionary with 10-20 essential terms (name variations for major factions, locations, characters) captures 80% of proper noun matching requirements with minimal maintenance overhead.

The FTS layer integrates into the hybrid search pipeline alongside pgvector semantic search, with Reciprocal Rank Fusion merging both result sets. Target latency is <50ms for FTS queries, leaving 150ms budget for vector search and graph extraction within the <500ms total pipeline constraint.

Migration to BM25 becomes necessary if lexical recall drops below 70% or precision issues emerge during Phase 4 validation testing. The migration path involves adding pg_search extension and replacing ts_rank_cd calls with BM25 scoring functions without architectural changes.

## References

- docs/decisoes-iniciais/entrevista-busca-hibrida-2026-01-30.md:150-180
- docs/decisoes-iniciais/entrevista-busca-hibrida-2026-01-30.md:270-310
- CLAUDE.md:30-47
