# ADR-001: Claude 3.5 Sonnet as Primary LLM

**Status:** Accepted
**Date:** 2026-01-29

## Context and Problem Statement

The Sentinel RAG system requires a Large Language Model for two critical workloads: (1) generating narrative-coherent responses from retrieved GDD context, and (2) extracting structured entities from complex RPG worldbuilding documents. The chosen model must excel at instruction-following, minimize hallucinations in retrieval-augmented scenarios, support large context windows for extensive graph metadata, and align with cost constraints for a single-user MVP (<$100/month total infrastructure).

The system prioritizes narrative quality and factual groundedness over raw speed, as responses must maintain consistency across interconnected lore elements (characters, factions, events, locations). The model must also handle multi-pass entity extraction with reliable JSON parsing for 15 node types across a semantic ontology.

[NEEDS INPUT: What specific narrative quality benchmarks or hallucination metrics were measured during model evaluation?]

## Decision Drivers

- Superior narrative coherence required for RPG worldbuilding and lore consistency
- Lower hallucination rates critical for factual grounding in RAG scenarios
- 200k token context window needed for hybrid prompts (graph metadata + text chunks)
- Cost optimization via reuse of existing Claude Pro plan ($20/month flat fee)
- Excellent instruction-following for complex system prompts with structured output
- Mature ecosystem with official SDK and function calling support

## Considered Options

1. Claude 3.5 Sonnet (Anthropic API)
2. GPT-4 Turbo (OpenAI API)
3. Local open-source models (Llama 3, Mistral)

## Decision Outcome

Chosen option: **Claude 3.5 Sonnet**, because it provides documented superior performance for narrative generation tasks, demonstrates lower hallucination rates in RAG benchmarks, offers a larger context window (200k vs 128k tokens), and leverages the developer's existing Pro plan to achieve zero additional cost during MVP development.

The model handles dual workloads with distinct configurations: RAG generation (temperature 0.3, max_tokens 1000) for conversational responses, and entity extraction (temperature 0.1, max_tokens 4000) for structured JSON output.

[NEEDS INPUT: What is the migration trigger threshold (exact message count or cost per month) for switching from Pro plan to pay-per-use API?]

## Pros and Cons of the Options

### Claude 3.5 Sonnet

**Pros:**
- Documented excellence in narrative coherence and worldbuilding tasks
- Lower hallucination rates compared to GPT-4 in RAG scenarios
- 200k token context window enables extensive prompt engineering
- Zero additional cost via Pro plan reuse ($20/month flat fee)
- Strong instruction-following for complex multi-pass entity extraction

**Cons:**
- Vendor lock-in to Anthropic API (pricing, availability, model lifecycle)
- Pro plan rate limits (~150-200 messages/day) require usage monitoring
- Model inference latency (~1-2s) dominates total pipeline response time
- Future migration to pay-per-use API ($3 input / $15 output per 1M tokens) needed at scale

### GPT-4 Turbo

**Pros:**
- Mature ecosystem with extensive third-party integrations
- Competitive pricing structure with pay-per-use model
- Strong general-purpose performance across diverse tasks

**Cons:**
- Lower narrative coherence quality compared to Claude for worldbuilding
- Higher hallucination rates observed in RAG benchmarks
- Smaller context window (128k tokens vs 200k) limits prompt design flexibility
- No existing Pro plan to leverage for cost optimization

### Local Open-Source Models

**Pros:**
- No API costs or rate limits for unlimited usage
- Complete control over model hosting and data privacy
- No vendor lock-in or dependency on external services

**Cons:**
- Significant infrastructure complexity (GPU provisioning, model serving)
- Quality gap for narrative generation compared to frontier models
- GPU hosting costs ($40-100/month) exceed API costs for MVP usage
- Operational burden for model updates and optimization

## Consequences

The system gains high-quality narrative generation and reliable entity extraction but inherits operational dependencies on Anthropic's API availability and pricing model. All LLM-dependent features (RAG pipeline, multi-pass extraction, prompt templates) become deeply coupled to Claude's capabilities and limitations.

Prompt engineering becomes a critical organizational asset requiring version control and systematic testing. Developers must monitor daily message usage to avoid exceeding Pro plan limits during development, with clear migration criteria defined for transitioning to pay-per-use pricing.

API key management spans local development, Docker Compose, and VPS deployment environments, requiring secure `.env` file handling and rotation procedures.

[NEEDS INPUT: What fallback strategy or service degradation plan exists if Anthropic API experiences extended outages?]

## References

- docs/decisoes-iniciais/entrevista-stack-rag-gdd-2026-01-29.md:295-342
- docs/pesquisas/Stack RAG Alta Fidelidade para GDDs.md:1-89
- CLAUDE.md:327-363
