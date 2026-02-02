# ADR-XXX: Docker Compose Orchestration for Development and Production

**Status:** Accepted
**Date:** 2026-01-29
**Related ADRs:** ADR-001 (PostgreSQL Unified Database), ADR-001 (Apache AGE Graph Extension)

---

## Context and Problem Statement

The Sentinel RAG system requires consistent infrastructure across local development and production VPS deployment. The system must orchestrate PostgreSQL 16 with custom-compiled Apache AGE and pgvector extensions, plus the NestJS application backend, while maintaining strict budget constraints and operational simplicity for a single-developer MVP.

Traditional deployment approaches present conflicts with project constraints: Kubernetes introduces operational complexity disproportionate to single-user workloads, PaaS platforms (Render, Railway) offer unpredictable cost scaling and vendor lock-in, and serverless architectures are incompatible with stateful database requirements and long-running LLM inference workloads.

The core problem: How to achieve identical infrastructure behavior across development and production environments while maintaining operational simplicity, cost predictability, and portability across VPS providers?

## Decision Drivers

- Cost predictability: VPS deployment must stay within <$100/month total budget with transparent pricing
- Development-production parity: Eliminate environment-specific bugs through identical infrastructure configuration
- Operational simplicity: Single-developer team requires minimal DevOps overhead and straightforward troubleshooting
- Custom extension support: Must enable compilation of Apache AGE and pgvector from source within PostgreSQL container
- Vendor neutrality: Avoid cloud provider lock-in to preserve migration flexibility across DigitalOcean, Linode, and AWS EC2

## Considered Options

1. **Docker Compose with custom PostgreSQL image** (chosen)
2. **Kubernetes cluster with Helm charts**
3. **PaaS deployment** (Render, Railway, or Fly.io)

## Decision Outcome

Chosen option: **Docker Compose with custom PostgreSQL image**, because it provides declarative infrastructure-as-code with identical execution across local and VPS environments, zero orchestration complexity, and predictable VPS costs of $10-40/month. The approach enables custom PostgreSQL extension compilation while maintaining single-command deployment workflows.

The decision accepts scaling limitations (vertical scaling only, manual container orchestration) in exchange for operational simplicity aligned with single-user MVP scope and cost constraints.

## Pros and Cons of the Options

### Option 1: Docker Compose with custom PostgreSQL image

**Pros:**
- Identical infrastructure locally and in production via declarative docker-compose.yml
- Zero orchestration complexity compared to Kubernetes control plane
- Predictable VPS costs ($10-40/month) with no platform markup
- Custom Dockerfile enables AGE and pgvector compilation from source

**Cons:**
- Limited to vertical scaling (upgrading VPS instance size)
- Manual container orchestration without auto-healing or load balancing
- No built-in blue-green deployment or automated rollback mechanisms
- Requires Docker expertise for debugging containerized applications

### Option 2: Kubernetes cluster with Helm charts

**Pros:**
- Horizontal pod autoscaling for handling traffic spikes
- Built-in health checks, auto-healing, and rolling deployments
- Cloud-agnostic deployment across managed Kubernetes services

**Cons:**
- Managed cluster costs $100-300/month exceed budget constraints
- Operational complexity disproportionate to single-user workloads
- Steep learning curve for Helm charts, kubectl, and cluster administration
- Custom PostgreSQL image still required for AGE/pgvector compilation

### Option 3: PaaS deployment (Render, Railway, Fly.io)

**Pros:**
- One-click deployment with managed infrastructure
- Automatic SSL, monitoring, and backup management
- Built-in CI/CD integration with GitHub

**Cons:**
- Cost scaling unpredictable ($50-200/month based on usage patterns)
- Limited support for custom PostgreSQL extensions (AGE compilation)
- Vendor lock-in with proprietary deployment configurations
- Reduced control over database performance tuning and resource allocation

## Consequences

**Positive:**
- Infrastructure reproducibility eliminates "works on my machine" environment drift
- Declarative docker-compose.yml serves as executable documentation of system architecture
- VPS portability enables cost optimization by migrating between providers without code changes
- Single-command workflows (`docker-compose up`) reduce deployment friction and onboarding time

**Negative:**
- Custom PostgreSQL Dockerfile requires maintenance for AGE and pgvector version updates
- Scaling limited to vertical VPS upgrades until migration to Kubernetes
- Manual deployment process without built-in CI/CD automation
- Team must understand Docker networking, volume persistence, and health check configuration

**Migration Triggers Identified:**
- Multi-user concurrency exceeding 10 simultaneous queries requiring horizontal scaling
- Embedding API latency >500ms P95 necessitating microservices architecture
- Need for blue-green deployments and automated rollback in production

## References

- docs/decisoes-iniciais/entrevista-stack-rag-gdd-2026-01-29.md:636-741
- docs/adrs/mapping.md:489-561
- CLAUDE.md:21-24
