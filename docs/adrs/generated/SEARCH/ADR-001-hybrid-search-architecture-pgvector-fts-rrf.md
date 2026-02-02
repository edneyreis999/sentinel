# ADR-001: Hybrid Search Architecture with pgvector, FTS, and RRF

**Status:** Accepted
**Date:** 2026-01-30

## Context and Problem Statement

The Sentinel RAG system requires retrieving relevant context from 900-2,400 text chunks of Game Design Document (GDD) content to support high-fidelity narrative query responses. The challenge lies in achieving high recall (85%+) across two distinct retrieval patterns: exact matches on technical terms and proper nouns (character names, faction names, location names), and semantic similarity on conceptual relationships and paraphrased queries.

Pure vector search fails when users query exact character names or specific technical terminology common in RPG GDDs. Pure keyword search misses semantic relationships and synonym variations critical for narrative understanding. A unified retrieval architecture must balance precision (exact term matching) with recall (semantic relevance) while maintaining sub-200ms latency on a single PostgreSQL database to meet cost constraints under $100/month.

## Decision Drivers

- Achieve 85-90% recall on both technical exact-match queries and semantic concept queries
- Maintain retrieval latency under 200ms to support total RAG pipeline target of <500ms
- Consolidate infrastructure into PostgreSQL to minimize operational complexity and licensing costs
- Support narrative RPG domain with high density of proper nouns and domain-specific terminology
- Enable future scaling to 10k+ chunks without architectural migration
- Preserve simplicity for single-user MVP while maintaining clear evolution path

## Considered Options

1. **Hybrid Search with pgvector (HNSW) + PostgreSQL FTS + RRF** (chosen)
2. Pure Vector Search with pgvector only
3. Separate specialized search infrastructure (Elasticsearch + Pinecone)

## Decision Outcome

Chosen option: **Hybrid Search with pgvector (HNSW) + PostgreSQL FTS + RRF**, because it elegantly solves the precision-recall trade-off by combining dense vector embeddings (semantic similarity) with sparse keyword indexes (exact matching) using Reciprocal Rank Fusion to merge results without requiring learned weights or training data.

The architecture executes vector search and full-text search in parallel against the same PostgreSQL database, then applies RRF scoring (k=60) to produce a unified ranked result set. This achieves the target 85-90% recall while maintaining infrastructure simplicity and zero additional licensing costs beyond PostgreSQL extensions (pgvector and native FTS).

## Pros and Cons of the Options

### Hybrid Search with pgvector + FTS + RRF

**Pros:**
- Achieves 85-90% recall across both exact-match and semantic query patterns
- Single database reduces operational complexity (no service orchestration, no data synchronization)
- RRF fusion requires no training data or learned parameters (parameter-free merging)
- Combined latency of 150-200ms meets pipeline budget with headroom for graph extraction
- PostgreSQL HNSW provides O(log N) query complexity enabling future scaling to 100k+ chunks

**Cons:**
- Complexity of maintaining three distinct indexes (HNSW vector, GIN full-text, GIN graph properties)
- PostgreSQL-only architecture creates vendor lock-in for search layer
- HNSW memory overhead of 200-300MB for baseline configuration (m=16, ef_construction=100)

### Pure Vector Search (pgvector only)

**Pros:**
- Simpler implementation with single index type and query path
- Lower total index storage (no GIN full-text index required)
- Native semantic understanding without keyword engineering

**Cons:**
- Fails on exact technical terms and proper nouns (character names frequently missed)
- Poor performance on out-of-vocabulary terms not represented in embedding training data
- Cannot leverage section metadata or structural signals from GDD organization
- Estimated 60-70% recall on domain-specific proper noun queries

### Separate Specialized Infrastructure (Elasticsearch + Pinecone)

**Pros:**
- Best-in-class specialized tools for respective search paradigms
- Advanced features (Elasticsearch analyzers, Pinecone metadata filtering)
- Independent scaling of vector and keyword search layers

**Cons:**
- Doubles infrastructure complexity (3 databases: PostgreSQL + Elasticsearch + Pinecone)
- Licensing costs exceed $100/month budget (Pinecone paid tier, Elasticsearch hosting)
- Data synchronization overhead and consistency challenges across three systems
- Network latency for multi-service orchestration adds 50-100ms to query path

## Consequences

The hybrid search architecture establishes PostgreSQL as the unified data layer for text chunks, vector embeddings, full-text indexes, and graph data. This consolidation simplifies deployment to a single Docker Compose stack and eliminates cross-service synchronization complexity.

Future scaling beyond 10k chunks will require HNSW parameter tuning (increasing m from 16 to 24-32) with proportional RAM increase. Migration to microservices becomes viable if retrieval latency exceeds 500ms P95 or concurrent users exceed 10, at which point the SearchService can be extracted to Python/FastAPI with gRPC for synchronous calls while maintaining the unified PostgreSQL backend.

Alternative embedding models (OpenAI, Voyage AI) require full re-indexing of all chunks but the hybrid architecture remains unchanged - only the vector dimensions and HNSW index parameters need adjustment. The RRF fusion layer abstracts away scoring differences between retrieval methods, providing stability against future component upgrades.

## References

- `docs/decisoes-iniciais/entrevista-busca-hibrida-2026-01-30.md:46-82` - Complete RAG pipeline flow specification
- `docs/pesquisas/Busca Híbrida com pgvector e FTS.md:3-10` - State-of-art hybrid search research
- `docs/adrs/mapping.md:273-324` - SEARCH module architecture overview
