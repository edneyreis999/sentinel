# Potential ADR: Production Docker Security Hardening

## Context

The existing Docker Compose ADR covers orchestration strategy (why Docker Compose over Kubernetes/PaaS), but the project needed specific implementation patterns for building secure, optimized production container images for the NestJS application.

## Decision

Implement production Docker images with comprehensive security hardening:

1. **Multi-stage Dockerfile** - Separate builder and production stages
2. **Non-root user execution** - Dedicated `appgroup:app` user
3. **Entrypoint script pattern** - Wait-for-db + auto-migrations + exec
4. **Container healthcheck** - HTTP check against /health endpoint
5. **Dynamic Prisma symlink** - Version-agnostic pnpm hoisting workaround

## Key Implementation Details

### Multi-stage Build

```dockerfile
# Stage 1: Build
FROM node:24-alpine AS builder
# ... build with dev dependencies

# Stage 2: Production
FROM node:24-alpine AS production
# ... minimal runtime only
```

### Non-root User

```dockerfile
RUN addgroup -S appgroup && \
    adduser -S -G appgroup app && \
    chown -R app:appgroup /app
USER app
```

### Entrypoint Script

```bash
#!/bin/sh
set -e
until pg_isready -h postgres -p 5432 -U "$POSTGRES_USER"; do sleep 2; done
npx prisma migrate deploy
exec "$@"
```

### Dynamic Prisma Symlink (pnpm-specific)

```dockerfile
RUN PRISMA_UTILS=$(ls -d node_modules/.pnpm/@prisma+client-runtime-utils@*) && \
    ln -s "../${PRISMA_UTILS#node_modules/}/node_modules/@prisma/client-runtime-utils" \
    node_modules/@prisma/client-runtime-utils
```

## Rationale

- **Multi-stage builds**: Removes dev dependencies and build tools, reducing attack surface and image size
- **Non-root user**: Limits blast radius if application is compromised (principle of least privilege)
- **Entrypoint script**: Ensures database availability before app startup, preventing crash loops
- **Healthcheck**: Enables orchestrator health monitoring and automatic restarts
- **Dynamic symlink**: Works across Prisma version upgrades without Dockerfile changes

## Consequences

**Positive:**

- Production-grade security posture out of the box
- Smaller image size (~200MB vs ~800MB with dev dependencies)
- Self-healing containers via healthcheck
- Zero manual migration steps during deployment

**Negative:**

- More complex Dockerfile than single-stage alternative
- Prisma symlink is pnpm-specific (would differ for npm/yarn)
- Non-root user requires careful volume permission management

## Related Files

- `Dockerfile` - Multi-stage production build
- `docker/entrypoint.sh` - Startup orchestration script
- `docker-compose.yml` - Production orchestration
- `docker-compose.override.yml` - Development overrides

## References

- Commit: 0a68ecb (feat(docker): add production-ready containerization with security hardening)
- Related ADRs: INFRA-XXX (Docker Compose Orchestration)
