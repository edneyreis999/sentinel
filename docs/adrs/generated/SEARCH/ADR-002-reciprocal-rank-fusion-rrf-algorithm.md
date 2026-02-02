# ADR-002: Reciprocal Rank Fusion (RRF) Algorithm for Ranking Merge

**Status:** Accepted
**Date:** 2026-01-30
**Related ADRs:** ADR-001

## Context and Problem Statement

The hybrid search architecture retrieves chunks through two parallel mechanisms with incompatible scoring scales: pgvector returns cosine similarity values (0-1 range, higher is better), while PostgreSQL FTS returns ts_rank_cd scores (unbounded positive floats, higher is better). Merging these rankings requires handling heterogeneous score distributions where direct numerical comparison is mathematically invalid (e.g., ts_rank_cd=3.5 vs cosine=0.87 cannot be compared).

The system must produce a unified ranking of top-10 chunks from the combined results of both retrieval methods while avoiding score normalization brittleness, training overhead, and latency penalties. The final ranking directly impacts LLM response quality: incorrect prioritization places irrelevant chunks in the context window, leading to hallucinations.

## Decision Drivers

- Avoid score normalization challenges inherent to heterogeneous distributions (unbounded vs bounded scales)
- Achieve training-free fusion requiring no labeled query-document relevance data
- Maintain minimal computational overhead (<10ms) within 200ms total retrieval budget
- Support future extensibility to weighted fusion for query-type-specific tuning
- Ensure robustness to score distribution changes when dataset evolves

## Considered Options

1. **Reciprocal Rank Fusion (RRF) with k=60** (chosen)
2. Normalized Score Fusion with learned weights
3. Neural Reranking with Cohere Rerank API

## Decision Outcome

Chosen option: **Reciprocal Rank Fusion (RRF) with k=60**, because it converts absolute scores to relative ranks, eliminating scale incompatibility without requiring calibration. The algorithm applies reciprocal weighting (`score = Σ 1/(k + rank_i)`) that naturally favors documents appearing high in multiple rankings, achieving robust fusion in ~10ms overhead.

The standard k=60 constant from academic literature (Cormack et al. 2009) provides empirically validated smoothing: high enough to prevent over-weighting top-ranked items from a single source, low enough to preserve ranking signal. This parameter-free approach achieves 90-95% of learned reranker quality while maintaining training-free operation.

## Pros and Cons of the Options

### Reciprocal Rank Fusion (RRF) with k=60

**Pros:**
- Training-free operation requires no labeled query-document pairs
- Immune to score scale differences through rank-based conversion
- Minimal computational cost (~10ms for sorting and scoring operations)
- Proven robustness in RAG benchmarks achieving 90-95% of learned reranker performance

**Cons:**
- Fixed 50/50 implicit weighting cannot adapt to query-type patterns
- Loses absolute score magnitude information during rank conversion
- k=60 constant not tuned for domain-specific characteristics

### Normalized Score Fusion with learned weights

**Pros:**
- Explicit control over vector vs FTS contribution via α parameter
- Preserves absolute score magnitude information
- Can adapt weights per query type (70% FTS for exact terms, 30% for concepts)

**Cons:**
- Requires per-dataset calibration of α weight sensitive to score distributions
- Brittle to data evolution requiring re-calibration when corpus changes
- Normalization function choice (min-max, z-score) introduces additional hyperparameter

### Neural Reranking with Cohere Rerank API

**Pros:**
- Marginal quality improvement (2-5% NDCG gain) over RRF in benchmarks
- Learned cross-attention captures semantic relevance signals RRF cannot model

**Cons:**
- Adds $1 per 1,000 queries operational cost exceeding MVP budget
- Introduces 50-100ms latency penalty consuming retrieval budget
- External API dependency creates availability and data privacy concerns

## Consequences

RRF establishes rank-based fusion as the architectural pattern for merging heterogeneous retrieval signals. The FULL OUTER JOIN SQL implementation ensures documents appearing in only one ranking (FTS-only or vector-only matches) contribute to final scores, preventing silent exclusion of valid results.

Future evolution supports weighted RRF variants adjusting contribution ratios per query type: technical queries with exact character names can apply 70% FTS + 30% vector weights, while conceptual narrative queries use 30% FTS + 70% vector. This extension modifies the weighting formula to `(0.7 * 1/(60 + fts_rank)) + (0.3 * 1/(60 + vec_rank))` without changing the core RRF algorithm.

Migration to learned reranking becomes viable when query logs demonstrate systematic ranking errors or user feedback indicates quality degradation. The hybrid approach (RRF narrows to top-10, neural reranker refines to top-5) preserves RRF benefits while adding precision where business value justifies latency and cost.

## References

- docs/decisoes-iniciais/entrevista-busca-hibrida-2026-01-30.md:82-120
- docs/pesquisas/Busca Híbrida com pgvector e FTS.md:83-121
