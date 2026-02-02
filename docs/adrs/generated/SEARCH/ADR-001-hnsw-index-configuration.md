# ADR-001: HNSW Index Configuration for pgvector

**Status:** Accepted
**Date:** 2026-01-30

## Context and Problem Statement

The RAG system requires semantic search over 900-2,400 text chunk embeddings (384 dimensions) to retrieve relevant GDD sections. The challenge is achieving reliable recall (85%+) for vector similarity queries while operating within hardware constraints of 8GB RAM in Docker Compose environment. pgvector's HNSW (Hierarchical Navigable Small World) index requires three critical parameters that directly impact recall quality, memory footprint, and query latency. The decision must balance MVP validation needs (fast iteration, controlled costs) against future scalability to 10,000+ chunks.

HNSW is a graph-based Approximate Nearest Neighbor algorithm where `m` controls node connectivity (graph topology density), `ef_construction` determines build-time search depth (index quality), and `ef_search` sets runtime exploration breadth (recall-latency trade-off). Conservative parameters reduce RAM and enable rapid prototyping but cap maximum recall; aggressive parameters deliver production-grade precision but consume 3x memory and slow index builds.

## Decision Drivers

- Hardware constraint: 8GB total RAM shared between PostgreSQL, NestJS, Apache AGE, and pgvector index
- MVP dataset: 900-2,400 chunks, requiring 200-300MB for vector index at baseline configuration
- Recall target: 85-90% sufficient for validating RAG proposal, vs 95%+ for production systems
- Latency budget: <50ms for vector search component (total RAG pipeline <500ms excluding LLM)
- Scalability threshold: Migration path needed for 10,000+ chunks requiring REINDEX operation
- Operational simplicity: Single-user development environment prioritizes stability over maximum performance

## Considered Options

1. Conservative Baseline (m=16, ef_construction=100, ef_search=40)
2. Aggressive Production-Grade (m=32, ef_construction=128, ef_search=60)
3. IVFFlat Index Alternative

## Decision Outcome

Chosen option: **Conservative Baseline (m=16, ef_construction=100, ef_search=40)**, because it provides sufficient recall (85-90%) for MVP validation while consuming minimal RAM (200-300MB), leaving headroom for other Docker services. The configuration achieves <50ms query latency and enables rapid iteration during development phase. Scaling path is documented: REINDEX with m=24 when exceeding 10,000 chunks.

Runtime parameter `ef_search=40` is session-configurable, allowing per-query tuning for critical searches (increase to 60-100 for higher recall at acceptable latency cost).

## Pros and Cons of the Options

### Conservative Baseline (m=16, ef_construction=100, ef_search=40)

**Pros:**
- RAM footprint controlled at 200-300MB (leaves 7.7GB for other services)
- Excellent query latency <50ms for vector component
- Adequate 85-90% recall for MVP feature validation
- Fast index builds enable rapid schema iteration

**Cons:**
- Lower recall ceiling compared to aggressive configurations (85-90% vs 95-98%)
- Requires REINDEX operation when scaling beyond 10,000 chunks
- May miss relevant content in edge cases (10-15% false negatives)

### Aggressive Production-Grade (m=32, ef_construction=128, ef_search=60)

**Pros:**
- Production-quality recall 95-98% approaching exhaustive search
- Better graph topology handles complex semantic relationships
- Reduced false negatives in retrieval pipeline

**Cons:**
- RAM consumption 600-800MB (3x baseline, problematic in 8GB environment)
- Slower index build times impact development iteration speed
- Increased latency 80-120ms for marginal recall improvement
- Overkill for 2,400-chunk MVP dataset

### IVFFlat Index Alternative

**Pros:**
- Lower memory overhead for very large datasets (100k+ vectors)
- Simpler conceptual model (cluster-based partitioning)

**Cons:**
- Requires cluster training phase (HNSW is training-free)
- Lower recall than HNSW at equivalent parameter settings
- Performance degrades with high-dimensional embeddings (384 dims)

## Consequences

The conservative HNSW configuration establishes a performance baseline optimized for development velocity and MVP validation. Operators must monitor recall quality through user feedback: reports of "missing content" despite keyword presence indicate degraded recall requiring `ef_search` tuning (increase to 60-80) or REINDEX with higher `m` values.

Dataset growth beyond 10,000 chunks triggers mandatory REINDEX with m=24 or m=32, a 2-8 week operation depending on corpus size. Hardware upgrades (16GB VPS) enable migration to production-grade parameters (m=32, ef_construction=128) for 95%+ recall.

The session-level `ef_search` parameter provides tactical tuning without REINDEX: critical queries can temporarily boost recall by increasing exploration depth, trading latency for precision when business value justifies the cost.

## References

- docs/decisoes-iniciais/entrevista-busca-hibrida-2026-01-30.md:229-268
- docs/pesquisas/Busca Híbrida com pgvector e FTS.md:66-80
