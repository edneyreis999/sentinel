# ADR-002: 2-Stage Subgraph Extraction with FTS and Embedding Fallback

**Status:** Accepted
**Date:** 2026-01-30
**Related ADRs:** ADR-001 (Hybrid Search Architecture feeds chunk retrieval), GRAPH/ADR-002 (15-label schema being extracted), GRAPH/ADR-002 (Template-Based Cypher uses extracted entities)

## Context and Problem Statement

The GraphRAG pipeline retrieves 10-20 text chunks via hybrid search, but the LLM requires structured graph context (entities and relationships) to perform multi-hop reasoning over narrative dependencies. The system must identify which of the 15 node labels and ~2,400 graph entities are mentioned in retrieved chunks to construct relevant subgraphs for the LLM prompt.

Pure keyword matching misses semantic variations ("The Iron Guard" vs "guardians of the fortress"). Pure embedding similarity requires expensive runtime API calls to HuggingFace for every chunk-entity pair (~36,000 comparisons per query at 15 labels × 2,400 entities). The extraction must complete within 150-300ms to preserve the <500ms total RAG pipeline budget while achieving 85-100% recall on relevant entities.

## Decision Drivers

- Recall target: 85-100% of entities mentioned in chunks must be identified for narrative coherence
- Latency budget: 150-300ms for extraction to preserve total RAG pipeline <500ms target
- Storage vs runtime trade-off: Pre-computed embeddings (~200MB) vs on-demand HuggingFace API calls (+500ms per chunk)
- Adaptive performance: Avoid unnecessary computation when simple keyword matching suffices
- Schema integration: Works with 15 node labels across Personagem, Faccao, Local, Quest, Item, etc.
- Single database constraint: Leverage existing PostgreSQL with GIN and HNSW indexes

## Considered Options

1. **2-Stage Adaptive Pipeline (FTS + Embedding Fallback)** (chosen)
2. LLM-Based Entity Extraction via Claude 3.5 Sonnet
3. Stage 1 Only (FTS without embedding fallback)

## Decision Outcome

Chosen option: **2-Stage Adaptive Pipeline**, because it achieves optimal balance between performance (100-200ms for Stage 1, +50-100ms conditional Stage 2) and recall (85-95% from FTS, +15-20% from embeddings) by running expensive embedding similarity only when keyword matching yields insufficient entities (<3 threshold).

Stage 1 executes a single UNION ALL query across all 15 node labels using GIN indexes on `search_vector` JSONB properties, returning top-5 entities per chunk ranked by `ts_rank_cd`. Stage 2 triggers conditionally for chunks with <3 entities, computing cosine similarity against pre-stored `description_embedding` vectors via HNSW index to recover semantic variations missed by keyword search.

## Pros and Cons of the Options

### 2-Stage Adaptive Pipeline (FTS + Embedding Fallback)

**Pros:**
- Optimal recall: 85-95% from FTS + 15-20% boost from embeddings = 85-100% total
- Adaptive performance: Stage 2 runs only when needed (~30-40% of chunks based on proper noun density)
- Zero runtime API calls: Pre-computed description_embedding avoids HuggingFace latency
- Single database: Leverages existing GIN and HNSW indexes without additional infrastructure

**Cons:**
- Storage overhead: ~200MB for description_embedding across 15 labels × 2,400 entities × 384 dimensions
- Index maintenance: HNSW indexes require REINDEX when embedding model changes
- Heuristic tuning: <3 entities threshold may need adjustment based on query patterns
- Schema coupling: UNION ALL query hardcoded to 15 specific node labels

### LLM-Based Entity Extraction via Claude 3.5 Sonnet

**Pros:**
- Highest recall: 95-100% by understanding context and variations
- Handles typos and complex paraphrasing beyond embedding similarity
- No pre-computed storage required

**Cons:**
- Expensive: ~$0.01 per chunk × 10 chunks = $0.10 per query vs $0 for adaptive pipeline
- High latency: 500-1000ms for LLM call exceeds entire 500ms RAG budget
- API dependency: External service failure blocks entire retrieval pipeline

### Stage 1 Only (FTS without embedding fallback)

**Pros:**
- Simplest implementation with single UNION ALL query
- Fastest performance: 100-200ms with no conditional logic
- No embedding storage overhead

**Cons:**
- Lower recall: 70-85% misses 15-20% of semantically similar entities
- Poor handling of variations: "Iron Guard" vs "fortress guardians" not matched
- Unacceptable for narrative coherence: Missing entities breaks multi-hop reasoning chains

## Consequences

The 2-stage extraction establishes GraphRAG capability by bridging text chunks and knowledge graph structure. The adaptive trigger (<3 entities) represents a performance heuristic requiring validation through production query logs - operators should monitor "Stage 2 activation rate" and adjust threshold if >70% of chunks trigger fallback (indicates FTS dictionary needs synonym expansion).

Pre-computed `description_embedding` columns create ~200MB storage overhead but eliminate runtime HuggingFace API dependency, critical for single-user MVP cost optimization. Future embedding model changes (e.g., all-MiniLM-L6-v2 → Voyage AI) require full REINDEX across all 15 node labels, a multi-hour operation planned during low-traffic maintenance windows.

The UNION ALL query pattern tightly couples extraction logic to the 15-label schema. Adding new labels (Phase 3: Sistema, Classe, Raca) requires updating the extraction query and rebuilding HNSW indexes. Operators can split UNION ALL into 15 parallel queries for per-label performance profiling if latency exceeds budget, trading single round-trip simplicity for debugging granularity.

## References

- docs/decisoes-iniciais/entrevista-busca-hibrida-2026-01-30.md:112-146
- docs/decisoes-iniciais/entrevista-busca-hibrida-2026-01-30.md:368-541
- CLAUDE.md:33-62
