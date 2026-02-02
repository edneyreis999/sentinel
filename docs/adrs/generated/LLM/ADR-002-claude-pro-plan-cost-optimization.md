# ADR-002: Claude Pro Plan Cost Optimization Strategy

**Status:** Accepted
**Date:** 2026-01-29
**Related ADRs:** ADR-001

## Context and Problem Statement

The RAG system requires continuous LLM access for dual workloads: response generation (20+ queries/day during active development) and entity extraction (30+ extractions during GDD ingestion). Standard pay-per-token API pricing would incur $50-100/month costs during MVP development, conflicting with the <$100/month total infrastructure budget.

The developer maintains an existing Claude Pro subscription ($20/month flat fee) for CLI usage with ~150-200 messages/day limit. The decision addresses whether to reuse this Pro plan API key for production workloads during MVP phase, versus creating separate pay-per-use API access.

## Decision Drivers

- MVP budget constraint of <$100/month total infrastructure costs
- Existing Claude Pro subscription unused capacity during development hours
- Pro plan sufficient for MVP usage patterns (50 combined queries/extractions daily)
- Need for cost predictability during iterative development and testing
- Future migration path to pay-per-use at scale without architecture changes

## Considered Options

1. Reuse Claude Pro Plan API key for MVP
2. Create separate pay-per-use Anthropic API account from start
3. Use free-tier or cheaper LLM alternatives during development

## Decision Outcome

Chosen option: **Reuse Claude Pro Plan API key**, because it eliminates LLM costs entirely during MVP development (achieving $0 additional spend beyond existing subscription), provides sufficient daily capacity for single-user workflows, and enables seamless migration to pay-per-use when usage exceeds 150-200 messages/day or multi-user scenarios emerge.

The approach reuses the same API key across local development and Docker Compose environments, with monitoring via Anthropic console to track usage against daily limits.

[NEEDS INPUT: What specific daily message threshold triggers migration to pay-per-use API?]

## Pros and Cons of the Options

### Reuse Claude Pro Plan API key

**Pros:**
- Zero additional cost during MVP ($0 vs $50-100/month pay-per-use)
- Immediate API access without new account setup or billing configuration
- Same API endpoints and SDK integration as pay-per-use
- Daily limit (150-200 messages) exceeds MVP usage (50 queries/extractions)

**Cons:**
- Shared API key between personal CLI and production reduces isolation
- Daily rate limit requires monitoring to avoid unexpected throttling
- Cannot separate personal vs production usage metrics in Anthropic console
- Migration to pay-per-use needed at scale (100+ designers)

### Separate pay-per-use API account

**Pros:**
- Clean separation between development/personal and production environments
- Granular cost tracking and usage attribution per environment
- No daily message limits (only rate limits at requests/minute level)
- Scales naturally without migration friction

**Cons:**
- Immediate cost of $50-100/month during MVP for low usage volumes
- Requires credit card setup and ongoing billing management
- Eliminates cost advantage of existing Pro subscription
- Unnecessary infrastructure complexity for single-user MVP

### Free-tier or cheaper LLM alternatives

**Pros:**
- Lower or zero API costs during development phase
- Reduces financial risk during experimentation

**Cons:**
- Quality degradation compromises narrative coherence validation
- Different model capabilities require separate prompt engineering
- Migration friction when switching to production-grade model later
- Free tiers insufficient for entity extraction workloads (4k token outputs)

## Consequences

The system achieves the <$100/month MVP budget by eliminating LLM costs entirely, enabling aggressive testing and iteration without cost anxiety. All LLM integration code uses standard Anthropic SDK, making future migration to pay-per-use transparent (same API, same SDK, only pricing changes).

Developers must monitor daily message usage via Anthropic console, with Pro plan limit serving as natural throttle during development. When usage consistently exceeds 150-200 messages/day, migration trigger activates: create pay-per-use API key, update environment variable, verify billing.

API key management remains simple during MVP (single key in `.env` file), with production-grade separation deferred until multi-user deployment.

[NEEDS INPUT: What is the estimated pay-per-use monthly cost at 100 concurrent designers?]

## References

- docs/decisoes-iniciais/entrevista-stack-rag-gdd-2026-01-29.md:340-522
- CLAUDE.md:189-198
- docs/adrs/mapping.md:327-388
