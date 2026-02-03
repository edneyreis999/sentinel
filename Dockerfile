# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10

# Copy package files (root level, single package project)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy Prisma schema first (required for postinstall script)
COPY prisma ./prisma
COPY prisma.config.ts ./

# Install dependencies including dev dependencies for build
# Provide a dummy DATABASE_URL for prisma generate during build
RUN DATABASE_URL="file:./dev.db" \
    pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Stage 2: Production
FROM node:24-alpine AS production

WORKDIR /app

# Install pnpm and required dependencies for healthcheck
RUN npm install -g pnpm@10 && \
    apk add --no-cache wget

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install production dependencies including Prisma
RUN DATABASE_URL="file:./dev.db" \
    pnpm install --prod --frozen-lockfile && \
    pnpm add @prisma/client prisma @prisma/adapter-pg --ignore-scripts --save-optional

# Copy Prisma schema
COPY prisma ./prisma

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy generated Prisma client from builder
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:4000/health || exit 1

# Start application
CMD ["node", "dist/main.js"]
