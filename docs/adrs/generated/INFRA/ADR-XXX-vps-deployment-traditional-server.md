# ADR-XXX: VPS Deployment with Traditional Server Management

**Status:** Accepted
**Date:** 2026-01-29
**Related ADRs:** DB/ADR-001, RAG/ADR-001

---

## Context and Problem Statement

The Sentinel RAG system requires production deployment infrastructure supporting PostgreSQL with Apache AGE and pgvector extensions, a NestJS monolithic backend, and Docker Compose orchestration. The deployment strategy must align with strict cost constraints (<$100/month total budget) while enabling a single developer to manage production operations without dedicated DevOps expertise.

The core architectural question: Should deployment rely on managed Platform-as-a-Service abstraction (Render, Railway, Heroku), container orchestration platforms (Kubernetes, AWS ECS), serverless computing (Vercel, AWS Lambda), or traditional VPS infrastructure with manual server management?

The decision required balancing operational convenience against cost predictability, infrastructure learning objectives, and vendor independence for an MVP targeting single-user workloads with no high-availability requirements.

## Decision Drivers

- Cost predictability: Fixed monthly infrastructure budget of $10-40 versus variable PaaS pricing that can scale unexpectedly with usage
- Infrastructure learning: Hands-on operational experience with Linux server administration valued as professional development objective
- Vendor independence: Avoidance of platform-specific abstractions that create migration barriers when scaling requirements emerge
- Operational simplicity: Single-developer context where automated platform features provide limited value compared to direct server control
- MVP deployment scope: Pre-production phase where manual deployment workflows are acceptable trade-off for cost savings
- Future flexibility: Migration path preservation to managed platforms when team size or availability requirements change

## Considered Options

1. **VPS deployment with Git + PM2 + Nginx** (traditional server management)
2. **Platform-as-a-Service** (Render, Railway, or Heroku managed deployment)
3. **Container orchestration** (Kubernetes on managed clusters or self-hosted)

## Decision Outcome

Chosen option: **VPS deployment with Git + PM2 + Nginx**, because it provides complete infrastructure control with predictable fixed costs ($10-40/month) while enabling hands-on learning of production deployment fundamentals. The approach accepts manual operational responsibilities in exchange for zero vendor lock-in and cost transparency appropriate for MVP validation phase.

Deployment workflow: SSH access to Ubuntu 22.04 VPS, Git pull for code updates, PM2 for Node.js process supervision with auto-restart, and Nginx for reverse proxy with SSL termination via Certbot. Database runs in Docker Compose alongside application on same VPS instance.

Migration triggers documented: team size exceeding 3 developers where manual deployment creates bottleneck, need for auto-scaling beyond single VPS capacity, or high availability requirements demanding multi-region failover architecture.

## Pros and Cons of the Options

### VPS Deployment with Git + PM2 + Nginx

**Pros:**
- Fixed monthly cost ($10-40) with zero surprise scaling charges
- Complete infrastructure control including root access and custom OS configuration
- Zero vendor lock-in enabling trivial migration between providers
- Direct operational learning of deployment fundamentals

**Cons:**
- Manual operational responsibilities including security updates, SSL renewal, and database backups
- Single point of failure with no built-in high availability
- No automated deployment pipelines or one-click rollback mechanisms
- Developer responsible for server hardening and monitoring setup

### Platform-as-a-Service (Render/Railway/Heroku)

**Pros:**
- Automated deployments from Git push with zero manual SSH access required
- Managed SSL certificates, automatic renewal, and built-in CDN integration
- Platform-managed backups and one-click restoration interfaces
- Built-in monitoring dashboards and log aggregation

**Cons:**
- Variable pricing that can exceed $200/month with traffic scaling
- Platform-specific abstractions create vendor lock-in
- Limited infrastructure control and root access unavailable
- Auto-scaling behavior may trigger unexpected cost spikes

### Container Orchestration (Kubernetes)

**Pros:**
- Industry-standard orchestration enabling multi-cloud portability
- Native support for horizontal scaling and zero-downtime deployments
- Declarative infrastructure as code with version control integration
- Large ecosystem of operational tooling

**Cons:**
- Operational complexity unjustified for single-user MVP workload
- Managed Kubernetes baseline cost ($100-300/month) exceeds entire project budget
- Self-hosted Kubernetes requires significant DevOps expertise
- Over-engineering for current scale and availability requirements

## Consequences

**Operational responsibilities accepted**: The team assumes manual management of security updates via monthly `apt upgrade` execution, SSL certificate renewal through Certbot cron automation (configured once), database backups via `pg_dump` with cron scheduling, and production monitoring through PM2 process logs with manual spot-checks.

**Deployment workflow established**: Code updates deployed via SSH login, Git pull from main branch, npm build for TypeScript compilation, and PM2 restart command. Zero-downtime deployments not supported—brief service interruption accepted during restarts.

**Infrastructure portability achieved**: Deployment scripts work identically across DigitalOcean, Linode, and AWS EC2 instances. Migration between VPS providers requires only DNS update and data transfer, with no application code changes.

**Scaling limitations acknowledged**: Single VPS deployment creates performance ceiling determined by vertical scaling capacity. Horizontal scaling to multiple instances requires future architectural investment in load balancing, session management, and database connection pooling.

## References

- docs/decisoes-iniciais/entrevista-stack-rag-gdd-2026-01-29.md:742-820
- docs/adrs/mapping.md:548-560
- CLAUDE.md:87-89
