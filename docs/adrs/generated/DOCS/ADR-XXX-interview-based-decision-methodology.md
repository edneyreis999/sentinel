# ADR-XXX: Interview-Based Decision Methodology

**Status:** Accepted
**Date:** 2026-01-29

---

## Context and Problem Statement

The Sentinel project required transforming cutting-edge research on GraphRAG, hybrid search, and Apache AGE into practical architectural decisions. The challenge: how to systematically bridge the gap between state-of-the-art academic research and implementation constraints for a solo developer with zero prior experience in these technologies, working under strict budget limitations (<$100/month MVP).

Traditional architectural decision records (ADRs) document *what* was decided but often lose the *why* and *how* reasoning. With 44+ architectural decisions spanning database selection, LLM integration, embedding strategies, and graph schema design, the project needed a methodology that would:

- Capture explicit reasoning from research to decision
- Force consideration of alternatives and trade-offs
- Create bidirectional traceability (research ← decision → implementation)
- Enable future architects to challenge assumptions with full context
- Scale knowledge transfer for onboarding

## Decision Drivers

- Need to systematically identify technical gaps between research ideals and MVP constraints (single user, cost, first-time technologies)
- Requirement to document not just conclusions but the reasoning process for 44+ critical decisions
- Desire for audit trail linking state-of-the-art research to practical implementation choices
- Goal to enable future architectural evolution by preserving decision context and trade-offs
- Solo developer context requiring disciplined knowledge management without team collaboration

## Considered Options

1. **Interview-Based Decision Methodology** (Chosen)
2. **Traditional MADR Format**
3. **Direct Research-to-Code Approach**

## Decision Outcome

Chosen option: **Interview-Based Decision Methodology**, because it provides systematic transformation of research into executable decisions through structured "Gap Esclarecido" (Clarified Gap) sections with explicit justifications and cross-references.

Each decision document follows the interview report format with: header metadata, executive summary, decision rounds (RODADA), gap identification, concrete decisions, trade-off analysis, implementation configuration, and bidirectional references to source research.

This methodology was applied consistently across three foundational decision documents (Jan 29-30, 2026), establishing precedent for how architectural decisions are made in the project.

## Pros and Cons of the Options

### Interview-Based Decision Methodology

**Pros:**
- Captures "why" reasoning and forces explicit consideration of alternatives
- Creates complete audit trail from research to implementation with bidirectional traceability
- Scales knowledge transfer - new team members understand decision evolution
- Systematically addresses ambiguities through explicit gap identification
- Documents trade-offs between research ideals and practical constraints

**Cons:**
- Time-intensive (3 interview documents over 2 days for initial decisions)
- Requires disciplined documentation practice and higher barrier for architectural changes
- Potential for analysis paralysis when decisions need rapid iteration
- Higher overhead may slow decision-making velocity compared to lightweight approaches

### Traditional MADR Format

**Pros:**
- Standardized format widely recognized in industry
- Lightweight structure enables faster decision documentation
- Clear sections for context, drivers, options, and consequences

**Cons:**
- Lacks explicit research-to-decision traceability for state-of-the-art technologies
- Insufficient detail for capturing gap analysis between research and MVP constraints
- Does not systematically document the reasoning process, only final conclusions
- Weaker support for cross-referencing research sources

### Direct Research-to-Code Approach

**Pros:**
- Fastest path from research to implementation
- Minimal documentation overhead
- Enables rapid prototyping and experimentation

**Cons:**
- Too risky for first-time technology stack adoption (GraphRAG, Apache AGE)
- Loss of decision rationale makes future refactoring difficult
- No audit trail for understanding why specific approaches were chosen over alternatives
- Difficult to onboard new team members without documented reasoning

## Consequences

The interview methodology establishes a higher standard of rigor for technical decision-making. Future major architectural changes are expected to follow similar interview-based analysis, creating consistency in how decisions are documented.

This approach enables future architects to challenge assumptions with full context. The "Esclarecimento" sections explicitly clarify how project constraints (single user, <$100/month budget, first-time technologies) differ from research contexts (production systems, enterprise scale), providing clear migration paths when constraints change.

The methodology creates a template for future decision documents following the pattern: research identification → gap analysis → interview-style Q&A → decision with justification → cross-referencing → validation criteria. This scales knowledge management for a solo developer and establishes expectations for disciplined architectural evolution.

Risk: The methodology overhead may slow decision-making velocity for smaller technical choices. The project should reserve interview-based analysis for architectural decisions with significant impact, while using lightweight ADRs for tactical implementation choices.

## References

- docs/decisoes-iniciais/entrevista-stack-rag-gdd-2026-01-29.md:1-60
- docs/decisoes-iniciais/decisoes-arquiteturais-grafo.md:1-50
- docs/decisoes-iniciais/entrevista-busca-hibrida-2026-01-30.md:1-40
