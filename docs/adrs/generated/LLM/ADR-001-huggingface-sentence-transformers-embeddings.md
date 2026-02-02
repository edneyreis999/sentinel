# ADR-001: HuggingFace Sentence-Transformers for Embedding Generation

**Status:** Accepted
**Date:** 2026-01-29

---

## Context and Problem Statement

The RAG system requires vector embeddings to enable semantic similarity search over GDD text chunks and user queries. Every text chunk (100-2000 tokens) must be converted to a dense vector representation for storage in pgvector and retrieval during hybrid search. The embedding model choice fundamentally determines semantic search quality, storage requirements, API costs, and database schema constraints.

The system targets a single-user MVP with cost constraints (<$100/month total) while maintaining semantic search recall above 85%. The embedding solution must integrate with PostgreSQL pgvector, support batch processing of document chunks, and provide a migration path if quality proves insufficient during validation.

[NEEDS INPUT: What specific recall and NDCG@10 thresholds will trigger evaluation of alternative embedding models?]

## Decision Drivers

- Cost optimization for MVP phase using free-tier services (<$100/month budget constraint)
- Database schema locked to chosen embedding dimensions (migration requires full re-indexing)
- Semantic search quality target of 85% recall on narrative entity queries
- API latency impact on total RAG pipeline (<500ms target excluding LLM inference)
- Open-source model portability enabling future self-hosting if needed
- Language support considerations for English-primary GDD with potential Portuguese content

## Considered Options

1. **HuggingFace Sentence-Transformers (`all-MiniLM-L6-v2`)** - 384 dimensions
2. **OpenAI `text-embedding-3-large`** - 3072 dimensions
3. **Multilingual alternative (`paraphrase-multilingual-mpnet-base-v2`)** - 768 dimensions

## Decision Outcome

Chosen option: **HuggingFace Sentence-Transformers (`all-MiniLM-L6-v2`, 384 dimensions)**, because it provides zero marginal cost through the free tier (~30k requests/month), sufficient quality for English-dominant narrative text, minimal storage overhead (1.5KB per chunk), and open-source portability for future self-hosting if API latency becomes a bottleneck.

The 384-dimensional vectors balance semantic expressiveness with storage efficiency, enabling HNSW indexing with reasonable memory footprint (~200-300MB for 10k chunks). The decision explicitly documents migration criteria: if hybrid search recall falls below 85% during validation, upgrade to OpenAI `text-embedding-3-large` or switch to multilingual model if Portuguese content dominates.

[NEEDS INPUT: What batch size optimization balances API request efficiency versus latency for document processing?]

## Pros and Cons of the Options

### HuggingFace Sentence-Transformers (`all-MiniLM-L6-v2`)

**Pros:**
- Zero cost via free tier (~30k requests/month sufficient for single-user MVP)
- Lightweight storage (384 dimensions = ~1.5KB per chunk vs 12KB for 3072-dim alternatives)
- Open-source models enable future self-hosting without vendor lock-in
- Fast inference on warm API requests (200-500ms per batch)

**Cons:**
- Quality gap versus commercial models for complex semantic queries
- English-optimized (potential recall degradation on Portuguese GDD content)
- API cold-start latency can add 2-5s on first request
- Dimension lock-in requires full database migration if upgrading

### OpenAI `text-embedding-3-large`

**Pros:**
- Superior semantic quality with 3072 dimensions capturing nuanced relationships
- Low latency and high reliability from mature API infrastructure
- Strong multilingual support including Portuguese

**Cons:**
- Cost at scale (~$0.13 per 1M tokens adds $20-50/month at MVP volume)
- 8x storage increase (12KB per chunk) impacting pgvector index memory
- Vendor lock-in prevents future self-hosting option
- Overkill dimensionality for narrative domain-specific content

### Multilingual Alternative (`paraphrase-multilingual-mpnet-base-v2`)

**Pros:**
- Better Portuguese support if GDD contains substantial non-English content
- Still open-source and free via HuggingFace API
- 768 dimensions provide quality improvement over 384-dim baseline

**Cons:**
- 2x storage increase versus chosen model
- Slower inference due to larger model size
- [NEEDS INPUT: Has Portuguese content volume been quantified to justify this trade-off?]

## Consequences

The database schema is permanently locked to 384-dimensional vectors unless a full migration is executed (re-embedding all chunks, recreating pgvector indexes, updating application code). This creates a significant switching cost that must be balanced against quality validation results during Phase 1 testing.

L2 normalization must be enforced in all embedding generation code to ensure cosine distance compatibility with pgvector queries. API retry logic is required to handle HuggingFace cold-start errors (503 status) that occur when models spin up after idle periods.

The open-source nature of Sentence-Transformers provides a strategic escape hatch: if API latency exceeds 500ms P95 or free tier limits are exhausted, models can be self-hosted locally via Transformers library or ONNX runtime without code changes beyond endpoint configuration. This portability differentiates the decision from proprietary alternatives.

## References

- docs/decisoes-iniciais/entrevista-stack-rag-gdd-2026-01-29.md:192-218
- CLAUDE.md:370-375
- docs/adrs/mapping.md:370-375
