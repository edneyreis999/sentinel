# ADR-002: Production Docker Security Hardening

**Status:** Accepted
**Date:** 2026-02-04
**Related ADRs:** INFRA-001 (Custom PostgreSQL Docker Image), INFRA-XXX (Docker Compose Orchestration)

---

## Context and Problem Statement

The existing Docker Compose orchestration strategy established container-based deployment for the Sentinel RAG system, but lacked specific implementation patterns for building secure, production-grade container images for the NestJS application.

Production deployments require defense-in-depth security: minimizing attack surface through multi-stage builds, enforcing least-privilege execution via non-root users, ensuring database availability before application startup, enabling orchestrator health monitoring, and handling package manager complexities like pnpm's non-standard module hoisting behavior.

Without explicit security hardening, the default single-stage Dockerfile with root execution creates unnecessary risk: compromised applications gain full container privileges, unoptimized images increase storage costs and deployment times, and startup race conditions cause crash loops when databases are temporarily unavailable during container orchestration.

How can the project achieve production-grade container security while maintaining operational simplicity for single-developer deployment on budget-constrained VPS infrastructure?

## Decision Drivers

- Security posture: Minimize container attack surface and limit blast radius of application compromise
- Image optimization: Reduce production image size by removing development dependencies and build tools
- Startup reliability: Prevent crash loops through database health checks and automatic migration execution
- Operational monitoring: Enable orchestrator health checks for automatic container restart on failures
- Package manager compatibility: Handle pnpm's non-standard module hoisting without blocking Prisma runtime

## Considered Options

1. **Multi-stage Dockerfile with non-root user and entrypoint orchestration** (chosen)
2. **Single-stage Dockerfile with root execution and manual migrations**
3. **Buildpack-based image generation with Cloud Native Buildpacks**

## Decision Outcome

Chosen option: **Multi-stage Dockerfile with non-root user and entrypoint orchestration**, because it provides production-grade security through separation of build and runtime stages, enforces least-privilege execution via dedicated non-root user, guarantees database availability before application startup, and enables health-based container restart mechanisms.

The solution implements five complementary patterns: multi-stage builds that remove development dependencies, non-root user execution limiting privilege escalation, entrypoint scripts coordinating database readiness and migrations, HTTP healthchecks enabling orchestrator monitoring, and dynamic Prisma symlinks resolving pnpm hoisting issues across version upgrades.

This approach trades Dockerfile complexity for security depth and operational reliability aligned with production deployment requirements.

## Pros and Cons of the Options

### Multi-stage Dockerfile with Security Hardening

**Pros:**

- Attack surface reduction through removal of build tools and development dependencies from production image
- Privilege escalation protection via dedicated non-root user limiting container compromise impact
- Zero-downtime migrations with automatic database readiness checks preventing startup race conditions
- Self-healing containers through HTTP healthchecks enabling orchestrator automatic restarts

**Cons:**

- Dockerfile complexity increases with multi-stage builds and dynamic symlink logic
- pnpm-specific Prisma symlink workaround requires maintenance across package manager changes
- Non-root user execution demands careful volume permission management for mounted directories
- Build time increases slightly due to two-stage compilation and dependency copying

### Single-stage Dockerfile with Root Execution

**Pros:**

- Simpler Dockerfile with single-stage build reducing cognitive overhead
- Zero volume permission issues with root user having universal file access
- Faster builds without multi-stage dependency copying

**Cons:**

- Security vulnerability with root execution enabling full container privilege escalation
- Bloated production images including development dependencies and build tools
- No automated migration strategy requiring manual deployment steps
- Missing healthcheck prevents orchestrator automatic recovery from application failures

### Buildpack-based Image Generation

**Pros:**

- Convention-over-configuration with automatic detection of Node.js stack
- Standardized image format following Cloud Native Computing Foundation specifications
- Zero Dockerfile maintenance with buildpack managing security updates

**Cons:**

- Limited control over Prisma client generation and migration execution flow
- pnpm support immature compared to npm/yarn in standard buildpacks
- Docker Compose incompatibility requiring Kubernetes or Cloud Foundry orchestration
- Build opacity making troubleshooting compilation failures more difficult

## Consequences

**Positive:**

- Production image size reduced from approximately 800MB to 200MB through multi-stage dependency pruning
- Container security hardened through non-root execution limiting attack surface and privilege escalation vectors
- Deployment reliability improved with automatic database migrations eliminating manual deployment steps
- Self-healing production infrastructure enabled via HTTP healthchecks triggering orchestrator container restarts

**Negative:**

- Dockerfile maintenance complexity increases with dynamic Prisma symlink requiring updates if migrating from pnpm to npm or yarn
- Development-production parity slightly reduced as override removes entrypoint health checks in local environments
- Volume permission management becomes critical for non-root user requiring explicit ownership configuration in docker-compose
- Team must understand multi-stage build patterns and entrypoint script execution order for troubleshooting deployment failures

## References

- Dockerfile:1-73
- docker/entrypoint.sh:1-16
- docker-compose.yml (production healthcheck configuration)
- docker-compose.override.yml (development entrypoint bypass)
