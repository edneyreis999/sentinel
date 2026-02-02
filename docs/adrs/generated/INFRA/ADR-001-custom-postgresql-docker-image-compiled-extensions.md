# ADR-001: Custom PostgreSQL Docker Image with Compiled AGE and pgvector Extensions

**Status:** Accepted
**Date:** 2026-01-29
**Related ADRs:** DB/ADR-001, GRAPH/ADR-001

---

## Context and Problem Statement

The Sentinel project requires PostgreSQL 16 with two specialized extensions: Apache AGE for graph database capabilities and pgvector for vector similarity search. These extensions are critical dependencies for the unified database architecture that combines relational, graph, vector, and full-text search paradigms in a single PostgreSQL instance.

No official Docker image exists that provides PostgreSQL 16 with both AGE and pgvector pre-installed. Managed database services (AWS RDS with pgvector, Supabase) either lack AGE support or incur costs ($50-200/month) that exceed the MVP budget constraint of <$100/month total infrastructure spend. The project needed a deployment strategy that provides complete control over extension versions while maintaining zero licensing costs and operational simplicity for single-user deployment.

## Decision Drivers

- Cost constraint of <$100/month total infrastructure with zero database licensing fees
- No official PostgreSQL Docker image exists with both AGE and pgvector pre-installed
- Need for guaranteed compatibility between specific versions of PostgreSQL, AGE, and pgvector
- Operational simplicity for solo developer deployment without managed service dependencies
- Complete control over extension update cycles and version pinning for stability
- Ability to optimize Docker image size for VPS deployment with limited storage

## Considered Options

1. **Custom Docker image with compiled AGE and pgvector from source**
2. **AWS RDS for PostgreSQL with pgvector + separate graph database**
3. **Supabase managed PostgreSQL with vector support**

## Decision Outcome

Chosen option: **Custom Docker image based on postgres:16 that compiles Apache AGE and pgvector from source**, because it provides complete control over extension versions, eliminates managed service costs, and guarantees compatibility between PostgreSQL and both extensions within a single unified database architecture.

The solution uses a multi-stage Docker build that clones Git repositories for AGE and pgvector, compiles them with C/C++ toolchains, installs into PostgreSQL extensions directory, and performs cleanup to minimize final image size. This trades convenience of managed services for infrastructure autonomy and cost efficiency.

## Pros and Cons of the Options

### Custom Docker Image with Compiled Extensions

**Pros:**
- Zero licensing costs and no managed service fees ($0/month vs $50-200/month)
- Complete version control with ability to pin specific Git tags for stability
- Guaranteed compatibility through explicit compilation against postgres:16 base image
- Single Docker container deployment simplifies orchestration and backup strategies

**Cons:**
- Compilation adds 5-10 minutes to Docker build times in CI/CD pipelines
- Requires C/C++ compilation knowledge for troubleshooting build failures
- Maintenance burden for tracking upstream AGE/pgvector releases and testing compatibility
- Image size increases to ~800MB-1GB compared to ~300MB base postgres:16

### AWS RDS with pgvector + Separate Graph Database

**Pros:**
- Fully managed service eliminates extension compilation and database maintenance
- Automatic backups, monitoring, and high availability built-in
- pgvector officially supported as native RDS extension

**Cons:**
- Monthly costs of $50-100+ for RDS instance exceed MVP budget
- Still requires separate graph database (Neo4j/Memgraph) adding operational complexity
- No AGE support in RDS forces dual-database architecture
- Vendor lock-in to AWS ecosystem limits portability

### Supabase Managed PostgreSQL

**Pros:**
- Free tier available for small workloads with pgvector support
- Managed platform reduces operational overhead
- Built-in authentication and API layer for rapid prototyping

**Cons:**
- No Apache AGE support requires separate graph database deployment
- Free tier limitations on storage and compute insufficient for production MVP
- Vendor lock-in with proprietary API abstractions over PostgreSQL
- Scaling beyond free tier costs comparable to AWS RDS

## Consequences

**Positive:**
- Infrastructure database costs remain at $0, preserving <$100/month budget for VPS hosting only
- Dockerfile serves as executable infrastructure documentation ensuring reproducible builds
- Version pinning capability enables stability testing before production extension upgrades
- Single Docker container deployment reduces orchestration complexity to docker-compose only

**Negative:**
- CI/CD build times increase by 5-10 minutes for extension compilation on every Dockerfile change
- Team must monitor upstream AGE and pgvector releases manually for security patches and compatibility
- Docker image registry storage increases with ~1GB images consuming bandwidth and disk space
- PostgreSQL version upgrades (16 → 17) require recompilation testing to verify extension compatibility

**Mitigation:**
- Cache Docker build layers to avoid recompiling extensions on non-Dockerfile changes
- Pin specific Git tags for AGE and pgvector to prevent unexpected breaking changes
- Subscribe to AGE/pgvector GitHub release notifications for proactive security updates
- Document migration trigger: if compilation becomes bottleneck, evaluate pre-built images or managed services

## References

- docs/decisoes-iniciais/entrevista-stack-rag-gdd-2026-01-29.md:636-666
- docs/decisoes-iniciais/decisoes-arquiteturais-grafo.md:1-50
- docs/adrs/mapping.md:520-528
- CLAUDE.md:19-46
