# ADR-002: Hybrid Prompt Template Combining Graph Metadata and Text Chunks

**Status:** Accepted
**Date:** 2026-01-29
**Related ADRs:** ADR-001 (Claude 3.5 Sonnet), SEARCH/ADR-001 (Hybrid Search Architecture)

## Context and Problem Statement

The GraphRAG pipeline retrieves two fundamentally different data types: structured graph metadata (entities and relationships from Apache AGE Cypher queries) and unstructured text chunks (from hybrid search via pgvector + FTS + RRF). The challenge lies in presenting both sources to the LLM in a format that enables multi-hop relational reasoning while preserving detailed narrative context.

Traditional RAG systems pass only text chunks to the generation model, forcing the LLM to infer relationships implicitly from prose descriptions. This approach fails for queries requiring explicit structural reasoning such as "Which characters have rivalries with Faction X?" where the relationship metadata is critical for accuracy. GraphRAG research demonstrates that explicit graph structure enables connecting dispersed information across documents.

The system must define a single prompt architecture that balances token consumption (~5500 tokens per query), LLM comprehension of dual-context data, and response quality across different query types (entity lookup, narrative generation, relational analysis).

## Decision Drivers

- Multi-hop reasoning requires explicit graph relationships visible to the LLM
- Dual-context presentation (structured + unstructured) maximizes fidelity for complex queries
- Token budget constraints under Claude Pro plan limits (~150-200 messages/day)
- Template becomes critical organizational asset requiring version control
- Query complexity varies (simple fact lookup vs deep relational analysis)
- Groundedness depends on LLM seeing source structure alongside narrative text

## Considered Options

1. **Hybrid prompt with separated sections** (graph metadata + text chunks + query)
2. Chunks-only prompt (traditional RAG baseline)
3. Graph-only prompt with embedded text in node properties

## Decision Outcome

Chosen option: **Hybrid prompt with separated sections**, because it explicitly exposes graph structure (entities and relationships) alongside narrative chunks, enabling Claude 3.5 Sonnet to synthesize relational reasoning with contextual details. The three-section template (KNOWLEDGE GRAPH METADATA / TEXT CHUNKS FROM GDD / USER QUERY) provides clear boundaries between data types while maintaining LLM comprehension.

Token allocation targets ~2000 tokens for graph metadata (top-10 entities, top-15 relationships), ~3000 tokens for text chunks (top-10 at 300 tokens average), and ~500 tokens for system prompt, totaling ~5500 tokens per query. This fits comfortably within Claude's 200k context window while leaving headroom for complex multi-entity queries.

[NEEDS INPUT: What optimal ratio of graph tokens to chunk tokens should be maintained for different query types?]

## Pros and Cons of the Options

### Hybrid Prompt with Separated Sections

**Pros:**
- Explicit graph structure enables direct relational queries without inference
- Dual context maximizes fidelity by combining semantic structure with narrative detail
- Clear section boundaries aid LLM parsing and response attribution
- Template structure supports future query-type specialization

**Cons:**
- Higher token consumption (~5500 vs ~3000 for chunks-only) impacts daily query limits
- Complexity requires coordination between hybrid search and subgraph extraction
- Template becomes critical maintenance burden requiring version control
- Failure in graph extraction degrades prompt quality without clear fallback

### Chunks-Only Prompt (Traditional RAG)

**Pros:**
- Lower token consumption (~3000 tokens) enables more queries per day
- Simpler implementation with single retrieval path
- No dependency on graph query success
- Standard RAG pattern with proven stability

**Cons:**
- Fails on explicit relational queries requiring graph traversal
- Forces LLM to infer structure from prose (error-prone for complex relationships)
- Lower recall for multi-hop queries spanning disconnected text chunks
- Misses GraphRAG paradigm benefits for narrative domains

### Graph-Only Prompt with Embedded Text

**Pros:**
- Minimal token consumption by storing full text in node properties
- Single query path via Cypher eliminates hybrid coordination
- Graph structure provides complete relational context

**Cons:**
- Loses fine-grained narrative detail from chunk segmentation
- Poor scalability as text embeds bloat graph storage
- Section-level metadata lost (GDD organization context)
- Graph queries become slow with large text properties

## Consequences

The hybrid prompt architecture establishes template engineering as a critical operational concern requiring systematic version control and A/B testing infrastructure. All RAG responses become dependent on successful execution of both hybrid search (chunk retrieval) and subgraph extraction (graph metadata), creating dual failure modes.

Graceful degradation logic must handle cases where graph extraction fails or returns sparse results, falling back to chunks-only prompts while logging quality degradation. Token consumption per query (~5500 tokens) limits Claude Pro plan usage to ~150-200 queries daily, requiring migration to pay-per-use API (~$0.0165/query) when exceeding limits.

Future optimization paths include query-type detection (entity enumeration vs narrative generation vs analysis) with specialized templates per category, and dynamic token allocation based on graph metadata richness (allocate more tokens to chunks when few entities found).

[NEEDS INPUT: What A/B testing metrics will validate hybrid prompts outperform chunks-only baselines?]

## References

- docs/decisoes-iniciais/entrevista-stack-rag-gdd-2026-01-29.md:566-632
- docs/pesquisas/Stack RAG Alta Fidelidade para GDDs.md:25-30
- CLAUDE.md:376-380
