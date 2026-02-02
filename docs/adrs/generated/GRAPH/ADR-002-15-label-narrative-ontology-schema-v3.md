# ADR-002: 15-Label Narrative Ontology Schema v3 for RPG Knowledge Graph

**Status:** Accepted
**Date:** 2026-01-30
**Related ADRs:** ADR-001 (Apache AGE provides infrastructure for this schema)

---

## Context and Problem Statement

The Sentinel project models complex narrative RPG content for Daratrine, requiring representation of character emotional journeys, quest branching, scene-level interactions, and choice consequences. Generic RPG ontologies focus on combat mechanics and stats rather than narrative depth, lacking constructs for emotional states, character arcs across acts, and scene granularity.

The system needs a domain-specific graph schema enabling queries like "emotional journey of character X through quest Y" and "choice paths resulting in game state Z." This schema must support multi-pass LLM entity extraction, type-safe TypeScript integration, and incremental implementation across three development phases while maintaining extraction reliability and query performance.

## Decision Drivers

- Narrative fidelity requirements: Model emotional states per scene, character arcs per act, and choice consequences for high-fidelity RAG
- LLM extraction alignment: Schema phases match multi-pass extraction strategy to manage token costs and complexity
- Type safety: Compile-time validation via TypeScript interfaces prevents runtime errors in entity handling
- Query optimization: Fixed labels enable index design and template-based Cypher generation
- Incremental validation: Three-phase rollout validates narrative core before adding quest and gameplay complexity
- Extensibility pattern: Versioned schema evolution (v1 → v2 → v3) establishes migration framework

## Considered Options

1. Customized 15-label ontology (Schema v3)
2. Generic RPG ontology (e.g., Generic Role Playing Game Ontology)
3. Schema-less graph with flexible labels

## Decision Outcome

Chosen option: **Customized 15-label, 26-relationship ontology (Schema v3)**, because it precisely models Daratrine's narrative structure with domain-specific constructs unavailable in generic schemas (EstadoEmocional per scene, ArcoPersonagem per act, Escolha with reversibility).

The schema organizes entities into five categories: Narrative Entities (Personagem, Faccao, Local, Evento, Lore, Tema), Character Progression (ArcoPersonagem, EstadoEmocional), Quest Structure (Quest, Cena, Beat, Escolha), Gameplay (Item, Inimigo), and RPG Maker Integration (VariavelEstado). Phased implementation reduces risk: Phase 1 (7 labels) validates narrative foundation, Phase 2 (5 labels) adds quest complexity, Phase 3 (3 labels) integrates gameplay mechanics.

## Pros and Cons of the Options

### Customized 15-label ontology (Schema v3)

- **Good**: Precise fit for Daratrine narrative structure with 14 character properties including psychological depth
- **Good**: Enables fine-grained emotional tracking (EstadoEmocional per scene vs per act)
- **Good**: Type-safe TypeScript interfaces provide compile-time validation and IDE autocomplete
- **Good**: Phased implementation aligns with LLM extraction complexity management
- **Bad**: High coupling to specific project domain limits reusability across RPG projects
- **Bad**: Schema changes trigger expensive re-extraction via LLM calls for existing entities
- **Bad**: 15 labels with 26 relationships create learning curve for all team members

### Generic RPG ontology

- **Good**: Reusable across multiple RPG projects without customization
- **Good**: Community-validated structure with established patterns
- **Bad**: Focuses on combat/stats rather than narrative depth (no emotional state modeling)
- **Bad**: Lacks constructs for scene granularity and choice consequence tracking
- **Bad**: Generic properties miss domain-specific needs (character motivations, fears, dreams)

### Schema-less graph with flexible labels

- **Good**: Maximum flexibility for evolving requirements without migration
- **Good**: No upfront schema design effort required
- **Bad**: LLM extraction becomes unreliable without fixed target structure
- **Bad**: No compile-time validation in TypeScript increases runtime errors
- **Bad**: Query optimization impossible without predictable label structure
- **Bad**: Index design requires known property access patterns

## Consequences

**Positive**:
- Multi-hop narrative queries enabled: "characters in quests exploring theme X after event Z via emotional state transitions"
- Template-based Cypher generation achieves 100% reliability with 20+ pre-written templates hardcoded to labels
- Type-safe entity handling prevents runtime errors in LLM extraction output parsing
- Phased rollout validates each complexity layer before proceeding (7 → 12 → 15 labels)

**Negative**:
- All modules tightly coupled to schema structure: GRAPH storage, LLM extraction prompts, RAG subgraph queries, API responses
- Schema evolution (v4, v5) requires coordinated updates across extraction templates, Cypher queries, and TypeScript interfaces
- Learning curve for team members across all roles: designers authoring GDD content, developers writing queries, LLM engineers tuning prompts

**Neutral**:
- Schema versioning pattern established for future evolution with documented migration triggers
- Entity re-extraction cost scales linearly with schema additions (3 LLM passes × new label complexity)

## References

- docs/decisoes-iniciais/labels-arestas-v3.md:1-874
- docs/decisoes-iniciais/decisoes-arquiteturais-grafo.md:332-450
- CLAUDE.md:33-62
