# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files (root level, single package project)
COPY package.json yarn.lock ./

# Copy Prisma schema first (required for postinstall script)
COPY prisma ./prisma
COPY prisma.config.ts ./

# Install all dependencies (including dev dependencies for build)
# Provide a dummy DATABASE_URL for prisma generate during build
RUN DATABASE_URL="file:./dev.db" \
    yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN yarn build

# Keep all dependencies for production (Prisma CLI needed for migrations, full node_modules for runtime)
# Prisma client is already generated during install postinstall script

# Stage 2: Production
FROM node:24-alpine AS production

WORKDIR /app

# Install postgresql-client for pg_isready and wget for healthcheck
RUN apk add --no-cache wget postgresql-client

# Copy package files
COPY package.json yarn.lock ./

# Copy production node_modules and built app from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated ./dist/generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

# Copy entrypoint script
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create non-root user
RUN addgroup -S appgroup && \
    adduser -S -G appgroup app && \
    chown -R app:appgroup /app
USER app

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:4000/health || exit 1

# Start application via entrypoint
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/main.js"]
