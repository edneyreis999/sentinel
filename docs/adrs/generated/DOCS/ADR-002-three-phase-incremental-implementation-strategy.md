# ADR-002: Three-Phase Incremental Implementation Strategy

**Status:** Accepted
**Date:** 2026-01-29
**Related ADRs:** ADR-001 (Documentation-Driven Development), ADR-XXX (Interview-Based Decision Methodology)

---

## Context and Problem Statement

The Sentinel project aims to build a complex GraphRAG system combining Apache AGE knowledge graphs, pgvector embeddings, and PostgreSQL full-text search into a unified high-fidelity RAG pipeline. This represents a first-time implementation of multiple unfamiliar technologies (Apache AGE Cypher queries, agtype parsing, hybrid search fusion, GraphRAG patterns) for a solo developer with zero prior experience in these domains.

The core challenge: How to build a multi-component system involving unproven technology integrations while minimizing the risk of discovering fundamental architectural blockers late in development when they are most costly to address? The system requires coordinating graph schema evolution, entity extraction pipelines, hybrid search integration, and LLM orchestration across 7 modules (DB, GRAPH, SEARCH, LLM, RAG, API, INFRA).

Traditional all-at-once implementation carries high risk - if Apache AGE has fundamental parsing issues, performance bottlenecks, or integration problems with pgvector, discovering these after weeks of full schema implementation would be catastrophic for the 4-week MVP timeline.

## Decision Drivers

- First-time technology adoption requires early validation to avoid catastrophic late-stage discovery of fundamental blockers
- Learning curve management for novel concepts (Apache AGE agtype parsing, Cypher query templates, GraphRAG patterns, hybrid search fusion)
- Solo developer context benefits from frequent validation milestones providing psychological "wins" and clear progress markers
- Graph schema complexity increases from 7 to 15 labels across development - incremental reveal reduces cognitive load
- Success criteria must be testable at phase boundaries to provide go/no-go decision points before advancing
- Entity extraction synchronization with schema evolution avoids re-extraction overhead while validating accuracy incrementally

## Considered Options

1. **Three-Phase Incremental Implementation** (chosen)
2. **All-at-Once Full Schema Implementation**
3. **Feature-Based Phasing**

## Decision Outcome

Chosen option: **Three-Phase Incremental Implementation with validation milestones**, because it validates core GraphRAG hypothesis early (Phase 1) before full schema investment while managing learning curve through incremental complexity absorption.

The strategy divides development into three distinct phases aligned with graph schema evolution and system capability maturation:

- **Phase 1 (Week 1-2)**: Narrative Foundation - 7 core labels, basic Cypher queries, hybrid search with RRF, validation milestone at <100ms query performance
- **Phase 2 (Week 3)**: Quest System - Add 3 quest labels (10 total), multi-hop graph traversal, chunk-graph integration, validation at <200ms multi-hop queries with >90% subgraph recall
- **Phase 3 (Week 4)**: Gameplay Mechanics - Complete 15 labels, full RAG pipeline end-to-end, entity extraction automation, validation at <2s P95 end-to-end latency with zero hallucinations in controlled test set

Each phase boundary includes explicit validation checkpoints that must pass before progression, creating critical go/no-go decision points. If Phase 1 reveals Apache AGE is unsuitable, fallback to Neo4j remains viable due to early discovery.

## Pros and Cons of the Options

### Three-Phase Incremental Implementation

**Pros:**
- Early validation proves GraphRAG value before full schema investment, reducing wasted effort if core hypothesis fails
- Apache AGE surprises (parsing issues, performance bottlenecks, integration problems) discovered in Week 1-2 when cheapest to pivot
- Learning curve managed through incremental complexity absorption (basic Cypher → multi-hop → full pipeline)
- Frequent milestones provide psychological benefits for solo developer maintaining momentum
- Phase 1 success criteria become regression tests for Phases 2-3, ensuring earlier capabilities don't degrade

**Cons:**
- Delays full system capability to Week 4 instead of potentially earlier all-at-once delivery
- Entity extraction requires 3 separate LLM passes aligned to phases, consuming more API tokens than single-pass approach
- Phase boundaries create refactoring overhead (schema v1 → v2 → v3, type generation updates)
- Temptation to skip validation at phase boundaries under schedule pressure, undermining core risk mitigation value

### All-at-Once Full Schema Implementation

**Pros:**
- Fastest path to complete system capability if all integrations work as expected
- Single entity extraction pass more efficient than phased 3-pass approach
- No refactoring overhead from schema evolution across phases

**Cons:**
- High risk - discovering Apache AGE has fundamental issue after building complete 15-label schema wastes weeks of effort
- GraphRAG value hypothesis unvalidated until full implementation complete, no early pivot option
- Overwhelming cognitive load absorbing all novel concepts simultaneously (Cypher + agtype + GraphRAG + hybrid search)
- No intermediate milestones for solo developer to mark progress and maintain momentum

### Feature-Based Phasing

**Pros:**
- Allows focusing on individual system capabilities in isolation (search first, then graph, then integration)
- Clear feature boundaries simplify testing and validation

**Cons:**
- Doesn't validate core hypothesis (GraphRAG improves quality over pure vector search) early enough to enable pivot
- Integration surprises discovered late when components combined, similar risk to all-at-once approach
- Lacks natural alignment with graph schema evolution (7 → 11 → 15 labels)

## Consequences

**Positive:**
- All 7 modules (DB, GRAPH, SEARCH, LLM, RAG, API, INFRA) implement features incrementally following this phasing, establishing consistent development pattern
- Phase boundaries create natural points for architectural review before committing to next complexity level
- Entity extraction quality validated incrementally on simpler schemas before full pipeline complexity
- Success criteria from Phase 1 (<100ms queries, >85% hybrid search recall) become regression tests preventing performance degradation in later phases
- Future feature development expected to follow similar incremental reveal pattern, establishing project norms
- Onboarding developers join at phase boundaries with working system state rather than mid-implementation chaos

**Negative:**
- Schedule pressure may tempt skipping validation at phase boundaries, undermining core risk mitigation strategy
- Phase 3 may accumulate technical debt if shortcuts taken in Phases 1-2 under deadline pressure
- Refactoring overhead at schema evolution points (v1 → v2 → v3) consumes development time
- Three-pass entity extraction consumes more Claude API tokens than single-pass approach (cost impact: +$5-10 for MVP extraction)

**Neutral:**
- Documentation burden increases with phase-specific validation criteria and migration notes between schema versions
- Phase boundaries align with natural testing points (Phase 1: basic queries, Phase 2: multi-hop traversal, Phase 3: full RAG pipeline)

## References

- CLAUDE.md:86-97
- docs/decisoes-iniciais/decisoes-arquiteturais-grafo.md:29-50
- docs/adrs/mapping.md:712-767
- docs/decisoes-iniciais/labels-arestas-v3.md
