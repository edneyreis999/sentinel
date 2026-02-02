# ADR-002: Template-Based Cypher Query Generation Over Dynamic LLM Generation

**Status:** Accepted
**Date:** 2026-01-30
**Related ADRs:** ADR-001 (Apache AGE Graph Database Extension)

---

## Context and Problem Statement

The Sentinel RAG system requires natural language query capabilities over the knowledge graph to retrieve narrative context for LLM responses. Users need to ask questions like "which characters belong to the Iron Guard faction?" or "what is the relationship between character X and Y?" without writing Cypher queries directly.

The system must convert natural language to executable Cypher queries while maintaining the <500ms latency budget for the complete RAG pipeline and ensuring 100% query syntax correctness to prevent runtime errors. The solution must balance query flexibility against reliability for an MVP targeting 80% coverage of common narrative queries.

## Decision Drivers

- Query reliability: 100% syntax correctness required to prevent runtime failures in production
- Latency budget: <500ms total RAG pipeline (embedding + search + graph + LLM), Cypher generation must be minimal
- MVP scope constraint: 80% query coverage sufficient for initial validation with 5 core templates
- Schema coupling: Knowledge graph schema v3 has 15 labels and 26 relationship types requiring precise syntax
- LLM limitations: Risk of syntax errors, incorrect label usage, and hallucinated relationship types in dynamic generation
- Cost optimization: Reduce LLM token usage by shifting from full query generation to parameter extraction only

## Considered Options

1. Template-Based Generation (pre-written queries with parameter substitution)
2. Dynamic LLM Generation (real-time Cypher construction by LLM)
3. Auto-Cura Self-Healing Loops (retry mechanism with error feedback)

## Decision Outcome

Chosen option: **Template-Based Cypher Generation**, because it guarantees 100% query syntax correctness through pre-tested queries, minimizes latency by reducing LLM responsibility to parameter extraction only, and provides sufficient 80% coverage for MVP validation with 5 initial templates.

The LLM (Claude 3.5 Sonnet) extracts only parameter values from natural language queries and selects the appropriate template, rather than constructing full Cypher queries. Templates are stored as TypeScript constants and serve dual purposes: runtime execution and few-shot learning examples for the LLM.

The trade-off accepts lower query flexibility (fixed template set) in exchange for maximum reliability and minimal latency. Post-MVP evolution will add dynamic generation for the remaining 20% of edge-case queries.

## Pros and Cons of the Options

### Template-Based Generation

- **Good**: 100% syntax correctness (all templates pre-tested and validated)
- **Good**: Minimal latency overhead (no LLM query construction, only parameter extraction)
- **Good**: 80% MVP coverage with 5 core templates (documented assumption validated against common queries)
- **Good**: Templates serve as few-shot learning examples for LLM schema understanding
- **Bad**: Lower flexibility (queries outside template library require new template development)
- **Bad**: Template maintenance required when schema evolves (coupling to 15 labels and 26 relationships)
- **Bad**: Developer must manually identify when to add new templates vs extend existing ones

### Dynamic LLM Generation

- **Good**: Highest flexibility (can generate arbitrary Cypher queries for any user request)
- **Good**: No template maintenance overhead (adapts automatically to schema changes)
- **Bad**: Medium reliability (risk of syntax errors, incorrect label usage, hallucinated relationships)
- **Bad**: Medium-high latency (LLM query generation adds 200-400ms per request)
- **Bad**: Requires sophisticated error handling for malformed queries

### Auto-Cura Self-Healing Loops

- **Good**: Highest flexibility (eventually correct via retry mechanism)
- **Good**: High reliability (error feedback loop corrects syntax issues)
- **Bad**: High latency (multiple LLM calls per query, unacceptable for <500ms budget)
- **Bad**: Complexity overhead (error parsing, feedback prompt engineering, retry logic)
- **Bad**: Token cost increases with each retry iteration

## Consequences

The system achieves maximum query reliability and minimal latency overhead for the RAG pipeline but accepts reduced flexibility requiring template library expansion as query patterns emerge beyond the initial 5 templates. All graph queries become tightly coupled to the schema v3 structure (15 labels, 26 relationships).

Developers must maintain template versioning aligned with schema evolution, as each schema change may invalidate or require updates to existing templates. The template library becomes a critical organizational asset requiring documentation and systematic testing.

The LLM integration simplifies to parameter extraction rather than full query generation, reducing prompt complexity and token costs. Templates provide built-in few-shot learning examples, improving LLM accuracy for entity name recognition and schema understanding.

Post-MVP migration to hybrid approach is planned when uncovered queries exceed 20% threshold: core queries remain template-based (reliability), edge cases use dynamic generation (flexibility), critical queries use auto-cura fallback (eventual consistency).

## References

- docs/decisoes-iniciais/decisoes-arquiteturais-grafo.md:57-103
- docs/pesquisas/Grafos de Conhecimento RPG_ Implementação e Performance.md:161-162
- CLAUDE.md:104-113
