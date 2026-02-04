# Docker Setup for Sentinel

This guide covers running Sentinel in Docker containers for both production and development environments.

## Quick Start

### Production (4 steps)

```bash
# 1. Create environment file from template
cp .env.docker.example .env.docker
# Edit .env.docker with your secure credentials

# 2. Build and start all services
docker compose up -d

# 3. Check service health
docker compose ps

# 4. View logs
docker compose logs -f
```

The application will be available at http://localhost:4000

### Development

```bash
# Start with hot-reload
docker compose up

# Or use the npm script
pnpm docker:dev
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    docker-compose                       │
└─────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         │                                   │
┌────────┴────────┐              ┌───────────┴───────────┐
│     postgres    │              │       backend         │
│     (db)        │<─────────────│   (application)       │
└─────────────────┘  sentinel-   └───────────────────────┘
│ PostgreSQL 16    network       │ Node.js 24
│ Port: 5432/5433 │              │ Port: 4000
│ Volume: data    │              │ Entrypoint: /entrypoint.sh
└─────────────────┘              └───────────────────────┘
                                          │
                                 ┌────────┴────────┐
                                 │ entrypoint.sh   │
                                 └─────────────────┘
                                 │ 1. Wait for DB  │
                                 │ 2. Run migrate  │
                                 │ 3. Start app    │
                                 └─────────────────┘
```

## Services

### PostgreSQL

- **Image**: postgres:16-alpine
- **Port**: 5433 (host) → 5432 (container)
- **Credentials**: See `.env.docker`
- **Volume**: `postgres_data` (persistent storage)

### Backend

- **Build**: Multi-stage (builder + production)
- **Port**: 4000
- **Healthcheck**: http://localhost:4000/health
- **Features**:
  - Automatic database migrations on startup
  - Non-root user for security
  - Wait-for-db logic

## Available Commands

### Docker Compose

```bash
# Build images
docker compose build

# Start all services (production)
docker compose up -d

# Start all services (development with hot-reload)
docker compose up

# Stop services
docker compose down

# Stop and remove volumes
docker compose down -v

# View logs
docker compose logs -f
docker compose logs -f backend

# Execute command in container
docker compose exec backend sh
docker compose exec postgres psql -U sentinel_user -d sentinel_db
```

### NPM Scripts

```bash
# Development with hot-reload
pnpm docker:dev

# Production build
pnpm docker:build

# Production start
pnpm docker:up

# Stop services
pnpm docker:down

# View logs
pnpm docker:logs

# Clean everything (including volumes)
pnpm docker:clean
```

## Environment Variables

### Initial Setup

Copy the example file and configure your credentials:

```bash
cp .env.docker.example .env.docker
# Edit .env.docker with your secure credentials
```

### Configuration Template

The `.env.docker.example` file contains:

```env
# PostgreSQL Configuration
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=sentinel_db

# Application Configuration
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public
NODE_ENV=production
PORT=4000
LOG_LEVEL=info
```

> **Security Note**: The `.env.docker` file is gitignored and should never be committed to version control.

## Development Features

### Hot-Reload

Changes to source code trigger automatic rebuild:

- File watching via `CHOKIDAR_USEPOLLING` (required for Docker on macOS/Windows)
- Named volume for `node_modules` (prevents cross-platform issues)
- Debug port 9229 exposed

### Docker Compose Override

The `docker-compose.override.yml` automatically applies in development:

- Uses `Dockerfile.dev` (smaller, no build step)
- Mounts source code as volume
- Enables debug port
- Sets development environment variables

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :4000
lsof -i :5433

# Change ports in docker-compose.yml if needed
```

### Database Connection Issues

```bash
# Check database is ready
docker compose exec postgres pg_isready -U sentinel_user

# View database logs
docker compose logs postgres

# Connect to database directly
docker compose exec postgres psql -U sentinel_user -d sentinel_db
```

### Migrations Failed

```bash
# Check migration status
docker compose exec backend npx prisma migrate status

# Re-run migrations manually
docker compose exec backend npx prisma migrate deploy

# Reset database (WARNING: destroys data)
docker compose exec backend npx prisma migrate reset
```

### Hot-Reload Not Working

```bash
# Ensure CHOKIDAR_USEPOLLING is set
docker compose exec backend env | grep CHOKIDAR

# Recreate node_modules volume
docker compose down
docker volume rm sentinel_node_modules
docker compose up
```

### Permission Issues (non-root user)

```bash
# The container runs as 'app' user
# If file issues occur, check ownership
docker compose exec backend ls -la /app

# For development, override user if needed (not recommended for production)
# In docker-compose.override.yml, add:
# user: "${UID:-1000}:${GID:-1000}"
```

### Container Won't Start

```bash
# View detailed logs
docker compose logs backend

# Check container status
docker compose ps

# Rebuild from scratch
docker compose down
docker compose build --no-cache
docker compose up
```

## Production Deployment

### Building Production Image

```bash
docker build -t sentinel:latest .
```

### Running Single Container

```bash
docker run -d \
  --name sentinel \
  -p 4000:4000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  sentinel:latest
```

### Image Size

The production image is optimized:

- Base: `node:24-alpine` (~120MB)
- Dependencies: ~200MB
- Built app: ~50MB
- **Total: ~370MB**

## Security Features

1. **Non-root user**: Container runs as `app` user
2. **Minimal base**: Alpine Linux with minimal packages
3. **Healthchecks**: Automated monitoring
4. **Network isolation**: Services communicate via `sentinel-network`
5. **Secrets via env_file**: No hardcoded credentials

## Next Steps

- See [main README](../../README.md) for project overview
- See [ADR decisions](../adrs/INDEX.md) for architectural context
- Check [health endpoints](http://localhost:4000/health) for status
