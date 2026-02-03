# Docker Deployment Guide

This guide covers Docker deployment for the Sentinel backend application.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Docker Compose](#docker-compose)
- [Manual Docker Build](#manual-docker-build)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Overview

Sentinel uses a multi-stage Docker build optimized for production:

- **Stage 1 (Builder):** Compiles TypeScript and builds the application
- **Stage 2 (Production):** Minimal runtime image with only production dependencies

### Image Details

- **Base Image:** `node:24-alpine`
- **Package Manager:** pnpm 9.x
- **Database:** SQLite (embedded)
- **Port:** 4000
- **Health Check:** `/health` endpoint

## Prerequisites

- **Docker** 20.x or higher
- **Docker Compose** 2.x or higher (for docker-compose deployment)

### Installing Docker

- **macOS:** [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Linux:** `curl -fsSL https://get.docker.com | sh`
- **Windows:** [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Build and start the service
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop the service
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

The API will be available at `http://localhost:4000/graphql`

## Configuration

### Environment Variables

Set environment variables in `docker-compose.yml`:

```yaml
environment:
  NODE_ENV: production
  PORT: 4000
  DATABASE_URL: file:./data/sentinel.db
  LOG_LEVEL: info
```

### Available Variables

| Variable       | Description          | Default                   |
| -------------- | -------------------- | ------------------------- |
| `NODE_ENV`     | Environment mode     | `production`              |
| `PORT`         | Server port          | `4000`                    |
| `DATABASE_URL` | SQLite database path | `file:./data/sentinel.db` |
| `LOG_LEVEL`    | Logging level        | `info`                    |

## Docker Compose

### docker-compose.yml

```yaml
version: '3.9'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: sentinel-backend
    ports:
      - '4000:4000'
    environment:
      NODE_ENV: production
      PORT: 4000
      DATABASE_URL: file:./data/sentinel.db
      LOG_LEVEL: info
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'wget', '--quiet', '--tries=1', '--spider', 'http://localhost:4000/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

### Docker Compose Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose stop

# Restart services
docker-compose restart

# View logs
docker-compose logs -f backend

# Execute commands in container
docker-compose exec backend sh

# Remove containers and volumes
docker-compose down -v
```

### Volumes

The `./data` directory is mounted to persist the SQLite database:

```yaml
volumes:
  - ./data:/app/data
```

This ensures data persists across container restarts.

## Manual Docker Build

### Building the Image

```bash
# Build the image
docker build -t sentinel-backend .

# Build with build arguments
docker build --build-arg NODE_ENV=production -t sentinel-backend .
```

### Running the Container

```bash
# Run with default configuration
docker run -d \
  --name sentinel-backend \
  -p 4000:4000 \
  -v $(pwd)/data:/app/data \
  sentinel-backend

# Run with custom environment variables
docker run -d \
  --name sentinel-backend \
  -p 4000:4000 \
  -e LOG_LEVEL=debug \
  -v $(pwd)/data:/app/data \
  sentinel-backend
```

### Container Management

```bash
# View running containers
docker ps

# View container logs
docker logs -f sentinel-backend

# Execute commands in container
docker exec -it sentinel-backend sh

# Stop container
docker stop sentinel-backend

# Remove container
docker rm sentinel-backend

# Remove image
docker rmi sentinel-backend
```

## Production Deployment

### Deploying to VPS

1. **Copy files to server:**

```bash
scp -r sentinel user@server:/opt/
```

2. **SSH into server:**

```bash
ssh user@server
cd /opt/sentinel
```

3. **Deploy with Docker Compose:**

```bash
docker-compose up -d
```

### Using Reverse Proxy (Nginx)

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name api.sentinel.example.com;

    location /graphql {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location /health {
        proxy_pass http://localhost:4000/health;
    }
}
```

### SSL/TLS with Let's Encrypt

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d api.sentinel.example.com
```

### Health Checks

The container includes a built-in health check:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:4000/health || exit 1
```

Check health status:

```bash
docker inspect --format='{{.State.Health.Status}}' sentinel-backend
```

### Logging

Logs are written to stdout/stderr and can be viewed:

```bash
# View logs
docker logs -f sentinel-backend

# View last 100 lines
docker logs --tail 100 sentinel-backend

# View logs since timestamp
docker logs --since 2024-01-01T00:00:00 sentinel-backend
```

### Resource Limits

Set resource limits in `docker-compose.yml`:

```yaml
services:
  backend:
    # ... other configuration
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Dockerfile Details

### Multi-Stage Build

```dockerfile
# Stage 1: Build
FROM node:24-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@9
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN DATABASE_URL="file:./dev.db" pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Stage 2: Production
FROM node:24-alpine AS production
WORKDIR /app
RUN npm install -g pnpm@9 && apk add --no-cache wget
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN DATABASE_URL="file:./dev.db" pnpm install --prod --frozen-lockfile --ignore-scripts
COPY prisma ./prisma
COPY --from=builder /app/dist ./dist
RUN DATABASE_URL="file:./dev.db" npx prisma generate --schema=./prisma/schema.prisma
RUN mkdir -p /app/data
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:4000/health || exit 1
CMD ["node", "dist/main.js"]
```

### Build Stages Explained

1. **Builder Stage:**
   - Installs all dependencies (including devDependencies)
   - Compiles TypeScript to JavaScript
   - Runs Prisma generate

2. **Production Stage:**
   - Starts from fresh Alpine image
   - Installs only production dependencies
   - Copies compiled JavaScript from builder
   - Sets up health check
   - Runs the application

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs sentinel-backend

# Check container status
docker ps -a
```

### Database Connection Issues

Ensure the data volume is mounted:

```bash
docker volume inspect sentinel_data
```

### Port Already in Use

Change the port mapping:

```bash
docker run -p 4001:4000 sentinel-backend
```

### Health Check Failing

Test health endpoint manually:

```bash
docker exec sentinel-backend wget -O- http://localhost:4000/health
```

### Rebuilding After Code Changes

```bash
# Rebuild image
docker-compose build

# Restart with new image
docker-compose up -d
```

### Clean Everything

```bash
# Stop and remove containers
docker-compose down -v

# Remove images
docker rmi sentinel-backend

# Remove volumes
docker volume prune
```

## Monitoring

### Container Stats

```bash
docker stats sentinel-backend
```

### Inspect Container

```bash
docker inspect sentinel-backend
```

### View Processes

```bash
docker top sentinel-backend
```

## Security Best Practices

1. **Run as non-root user** (future enhancement)
2. **Use specific image tags** instead of `latest`
3. **Scan images for vulnerabilities** with `docker scan`
4. **Keep images updated** with security patches
5. **Use secrets management** for sensitive data
6. **Limit container resources** to prevent DoS

## Backup and Restore

### Backup Database

```bash
# Copy database from container
docker cp sentinel-backend:/app/data/sentinel.db ./backup/

# Or use volume backup
docker run --rm -v sentinel_data:/data -v $(pwd)/backup:/backup \
  alpine tar czf /backup/sentinel-db-backup.tar.gz /data
```

### Restore Database

```bash
# Copy database to container
docker cp ./backup/sentinel.db sentinel-backend:/app/data/
docker-compose restart backend
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NestJS Docker Deployment](https://docs.nestjs.com/faq/docker)
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/deployment/deploying-to-docker)

---

**For issues or questions, please open an issue on GitHub.**
