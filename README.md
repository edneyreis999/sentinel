# Sentinel

> High-fidelity RAG system for narrative RPG Game Design Documents (GDDs)

[![Build Status](https://img.shields.io/github/actions/workflow/status/coreto/sentinel/ci.yml)](https://github.com/coreto/sentinel/actions)
[![Coverage](https://img.shields.io/codecov/c/github/coreto/sentinel)](https://codecov.io/gh/coreto/sentinel)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![NestJS](https://img.shields.io/badge/nestjs-11.1.0-red)](https://nestjs.com)
[![License](https://img.shields.io/npm/l/@coreto/sentinel)](LICENSE)

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [NPM Scripts](#npm-scripts)
- [GraphQL API](#graphql-api)
- [Docker Deployment](#docker-deployment)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [Environment Configuration](#environment-configuration)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Overview

Sentinel (also known as Daratrine in the context of the specific RPG world being developed) is a high-fidelity RAG (Retrieval-Augmented Generation) system designed for narrative RPG Game Design Documents. The project focuses on maintaining semantic consistency and preventing hallucinations when working with complex, interdependent game design data.

Built with **NestJS** and **GraphQL**, Sentinel provides a robust backend for managing RPG Maker MZ projects, simulation history (TTK), and user preferences.

## Tech Stack

| Component             | Technology              | Version  |
| --------------------- | ----------------------- | -------- |
| **Framework**         | NestJS                  | 11.1.0   |
| **API**               | GraphQL (Apollo Server) | 5.3.0    |
| **ORM**               | Prisma                  | 7.3.0    |
| **Database**          | PostgreSQL              | 16.x     |
| **Validation**        | class-validator         | 0.14.3   |
| **Schema Validation** | Zod                     | 4.3.6    |
| **Runtime**           | Node.js                 | >=20.0.0 |
| **Package Manager**   | pnpm                    | >=10.0.0 |
| **Container**         | Docker                  | Latest   |

## Requirements

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher (Active LTS recommended)
- **pnpm** 10.x or higher
- **PostgreSQL** 16.x (or Docker for containerized database)
- **Git** for version control

### Installing pnpm

If you don't have pnpm installed:

```bash
npm install -g pnpm@10
```

### Installing Node.js

Using [nvm](https://github.com/nvm-sh/nvm) (recommended):

```bash
nvm install 20
nvm use 20
```

Or download from [nodejs.org](https://nodejs.org)

## Installation

```bash
# Clone the repository
git clone https://github.com/coreto/sentinel.git
cd sentinel

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Edit .env with your database configuration
# nano .env

# Generate Prisma Client
pnpm prisma:generate

# Run database migrations
pnpm prisma:migrate

# Start the development server
pnpm start:dev
```

The GraphQL API will be available at `http://localhost:3000/graphql`

## Quick Start

After installation, you can quickly verify everything is working:

```bash
# Check health status
curl http://localhost:3000/health

# Access GraphQL Playground
open http://localhost:3000/graphql
```

### Example Queries

Try this in the GraphQL Playground:

```graphql
query {
  health {
    status
    version
    uptime
  }
}
```

## NPM Scripts

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `pnpm build`           | Compile TypeScript to JavaScript     |
| `pnpm start`           | Start application in production mode |
| `pnpm start:dev`       | Start in development mode with watch |
| `pnpm start:debug`     | Start with debug enabled (inspect)   |
| `pnpm start:prod`      | Start production server from dist    |
| `pnpm lint`            | Run ESLint with auto-fix             |
| `pnpm format`          | Format code with Prettier            |
| `pnpm test`            | Run unit tests                       |
| `pnpm test:watch`      | Run tests in watch mode              |
| `pnpm test:cov`        | Run tests with coverage report       |
| `pnpm test:debug`      | Run tests with debug inspector       |
| `pnpm test:e2e`        | Run end-to-end tests                 |
| `pnpm prisma:generate` | Generate Prisma Client               |
| `pnpm prisma:migrate`  | Create and apply migrations          |
| `pnpm prisma:studio`   | Open Prisma Studio GUI               |
| `pnpm prisma:reset`    | Reset database (deletes data)        |

## GraphQL API

### Base URL

- **Development:** `http://localhost:3000/graphql`
- **Production:** Configured via `PORT` environment variable

### Playground

Apollo Sandbox/Playground is available in development mode at `/graphql`

---

### Queries

#### `health`

Check the health status of the application.

```graphql
query GetHealth {
  health {
    status
    version
    uptime
    timestamp
  }
}
```

**Response:**

```json
{
  "data": {
    "health": {
      "status": "healthy",
      "version": "0.0.1",
      "uptime": 12345,
      "timestamp": "2026-02-02T12:00:00.000Z"
    }
  }
}
```

#### `recentProjects`

List recent projects with pagination and filters.

```graphql
query GetRecentProjects {
  recentProjects(limit: 10, offset: 0, nameFilter: "MyProject", gameVersion: "1.0") {
    items {
      id
      name
      path
      gameVersion
      screenshotPath
      trechoCount
      lastOpenedAt
    }
    total
    limit
    offset
  }
}
```

#### `userPreferences`

Get user preferences with lazy initialization of defaults.

```graphql
query GetUserPreferences {
  userPreferences {
    userId
    theme
    language
    windowWidth
    windowHeight
    windowX
    windowY
    windowIsMaximized
    autoSaveInterval
    maxHistoryEntries
    lastProjectPath
  }
}
```

#### `simulationHistory`

List simulation history entries with filters and pagination.

```graphql
query GetSimulationHistory {
  simulationHistory(
    projectPath: "/path/to/project"
    status: "COMPLETED"
    ttkVersion: "1.0"
    dateFrom: "2026-01-01"
    dateTo: "2026-12-31"
    page: 1
    perPage: 20
  ) {
    id
    projectPath
    projectName
    status
    ttkVersion
    configJson
    summaryJson
    hasReport
    reportFilePath
    durationMs
    battleCount
    trechoCount
    timestamp
  }
}
```

#### `simulationHistoryEntry`

Get a single simulation history entry by ID.

```graphql
query GetSimulationEntry {
  simulationHistoryEntry(id: "clx1234567890") {
    id
    projectName
    status
    timestamp
  }
}
```

---

### Mutations

#### `addRecentProject`

Add or update a project in recent projects.

```graphql
mutation AddRecentProject {
  addRecentProject(
    path: "/path/to/project"
    name: "My RPG Project"
    gameVersion: "1.0.0"
    screenshotPath: "/path/to/screenshot.png"
    trechoCount: 42
  ) {
    id
    name
    path
    lastOpenedAt
  }
}
```

#### `removeRecentProject`

Remove a project from recent projects.

```graphql
mutation RemoveRecentProject {
  removeRecentProject(path: "/path/to/project") {
    success
    message
  }
}
```

#### `updateUserPreferences`

Update user preferences.

```graphql
mutation UpdatePreferences {
  updateUserPreferences(
    theme: DARK
    language: "en-US"
    windowWidth: 1920
    windowHeight: 1080
    autoSaveInterval: 60000
    maxHistoryEntries: 200
  ) {
    theme
    language
    windowWidth
    windowHeight
  }
}
```

#### `createSimulationHistoryEntry`

Create a new simulation history entry.

```graphql
mutation CreateSimulationEntry {
  createSimulationHistoryEntry(
    projectPath: "/path/to/project"
    projectName: "My RPG Project"
    ttkVersion: "1.0"
    configJson: "{\"difficulty\": \"normal\"}"
    durationMs: 5000
    battleCount: 10
    trechoCount: 25
    status: "PENDING"
    hasReport: false
  ) {
    id
    projectName
    status
    timestamp
  }
}
```

#### `updateSimulationStatus`

Update simulation status with state machine validation.

```graphql
mutation UpdateSimulationStatus {
  updateSimulationStatus(
    id: "clx1234567890"
    status: "COMPLETED"
    summaryJson: "{\"totalBattles\": 10}"
  ) {
    id
    status
    summaryJson
  }
}
```

#### `deleteSimulationHistory`

Delete a simulation history entry.

```graphql
mutation DeleteSimulationEntry {
  deleteSimulationHistory(id: "clx1234567890")
}
```

---

### Subscriptions

#### `userPreferencesChanged`

Subscribe to user preference changes.

```graphql
subscription OnPreferencesChanged {
  userPreferencesChanged {
    userId
    theme
    language
    windowWidth
    windowHeight
  }
}
```

#### `simulationStatusChanged`

Subscribe to simulation status updates.

```graphql
subscription OnSimulationStatusChanged($simulationId: String) {
  simulationStatusChanged(simulationId: $simulationId) {
    id
    status
    summaryJson
  }
}
```

#### `simulationHistoryChanged`

Subscribe to any changes in simulation history.

```graphql
subscription OnSimulationHistoryChanged {
  simulationHistoryChanged {
    id
    projectName
    status
    timestamp
  }
}
```

---

## Docker Deployment

Sentinel supports full containerization with automatic migrations, health checks, and development hot-reload.

### Quick Start

```bash
# 1. Create environment file
cp .env.docker.example .env.docker

# 2. Production (detached mode)
docker compose up -d

# Development (with hot-reload)
pnpm docker:dev
```

The application will be available at http://localhost:4000/graphql

### Features

- **Automatic migrations** on container startup
- **Health checks** for database and application
- **Non-root user** for security
- **Hot-reload** in development mode
- **Named volumes** for node_modules (cross-platform compatibility)
- **Debug port** 9229 exposed in development

### Available Commands

```bash
pnpm docker:dev      # Development with hot-reload
pnpm docker:build    # Build production images
pnpm docker:up       # Start production containers
pnpm docker:down     # Stop all services
pnpm docker:logs     # View logs
pnpm docker:clean    # Stop and remove volumes
```

### Services

| Service  | Port | Description            |
| -------- | ---- | ---------------------- |
| postgres | 5433 | PostgreSQL 16 database |
| backend  | 4000 | NestJS GraphQL API     |

**Complete documentation:** [docs/docker/SETUP.md](docs/docker/SETUP.md)

## Project Structure

```
sentinel/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module with GraphQL config
│   ├── graphql/                   # Generated GraphQL schema
│   ├── core/                      # Domain layer (DDD)
│   │   ├── recent-projects/       # Recent projects domain
│   │   ├── user-preferences/      # User preferences domain
│   │   ├── simulation-history/    # Simulation history domain
│   │   └── shared/                # Shared utilities
│   ├── nest-modules/              # NestJS infrastructure layer
│   │   ├── app/                   # App module & resolver
│   │   ├── recent-projects-module/# Recent projects GraphQL
│   │   ├── user-preferences-module/# User preferences GraphQL
│   │   ├── simulation-history-module/# Simulation history GraphQL
│   │   └── health/                # Health check endpoint
│   ├── database/                  # Database services
│   │   └── prisma.module.ts       # Prisma service provider
│   └── generated/                 # Generated files
│       └── prisma/                # Prisma client
├── prisma/
│   └── schema.prisma              # Database schema
├── test/                          # Test files
│   ├── jest-e2e.json              # E2E test configuration
│   └── ...                        # E2E test specs
├── docs/                          # Documentation
│   ├── CLAUDE.md                  # Navigation guide
│   ├── docker/                    # Docker documentation
│   │   └── SETUP.md               # Docker setup guide
│   ├── adrs/                      # Architecture Decision Records
│   ├── decisoes-iniciais/         # Initial decisions
│   └── pesquisas/                 # Technical research
├── docker/                        # Docker configuration
│   ├── entrypoint.sh              # Container startup script
│   └── Dockerfile.dev             # Development image
├── planos/                        # Project planning
├── coverage/                      # Test coverage reports
├── .env.example                   # Environment template
├── .env.docker                    # Docker environment variables
├── docker-compose.yml             # Docker services (production)
├── docker-compose.override.yml    # Docker services (development)
├── Dockerfile                     # Container image (production)
├── nest-cli.json                  # NestJS CLI config
├── tsconfig.json                  # TypeScript config
├── package.json                   # Dependencies and scripts
└── README.md                      # This file
```

## Development

### Code Style

This project uses:

- **ESLint** for linting
- **Prettier** for code formatting
- **TypeScript** strict mode

```bash
# Lint and fix issues
pnpm lint

# Format code
pnpm format
```

### Adding a New Module

Use the NestJS CLI:

```bash
# Generate a new module
nest g module my-feature

# Generate a resolver
nest g resolver my-feature

# Generate a service
nest g service my-feature
```

### Architecture Patterns

This project follows **Domain-Driven Design (DDD)** and **Clean Architecture**:

- **Domain Layer:** Core business logic, entities, value objects
- **Application Layer:** Use cases, input/output ports
- **Infrastructure Layer:** Database repositories, GraphQL resolvers

See [docs/adrs/](docs/adrs/) for architectural decisions.

### Debug Mode

```bash
# Start with inspect enabled
pnpm start:debug

# Or with VS Code
# Use .vscode/launch.json configuration
```

### Prisma Studio

Browse and edit database data:

```bash
pnpm prisma:studio
```

Opens at `http://localhost:5555`

## Testing

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:cov
```

Current coverage: **487 tests passing**

### E2E Tests

```bash
# Run end-to-end tests
pnpm test:e2e
```

### Test Structure

```
src/
├── **/__tests__/              # Unit tests
│   ├── *.spec.ts             # Test specs
│   └── *.e2e-spec.ts         # E2E specs
test/
└── **/*.e2e-spec.ts          # Global E2E tests
```

## Environment Configuration

Create a `.env` file from `.env.example`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/sentinel?schema=public"

# Application
PORT=3000
NODE_ENV=development

# Optional
LOG_LEVEL=debug
```

### Required Variables

| Variable       | Description                  | Default     |
| -------------- | ---------------------------- | ----------- |
| `DATABASE_URL` | PostgreSQL connection string | -           |
| `PORT`         | Server port                  | 3000        |
| `NODE_ENV`     | Environment                  | development |

### Optional Variables

| Variable    | Description   | Default |
| ----------- | ------------- | ------- |
| `LOG_LEVEL` | Logging level | info    |

## Documentation

- **Navigation Guide:** [docs/CLAUDE.md](docs/CLAUDE.md)
- **Architecture Decisions:** [docs/adrs/INDEX.md](docs/adrs/INDEX.md)
- **Development Guide:** [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
- **Docker Guide:** [docs/DOCKER.md](docs/DOCKER.md)
- **Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md)

### ADR Process

This project uses an agent-based workflow for Architecture Decision Records:

1. Create potential ADR: `docs/adrs/potential-adrs/{module}/{name}.md`
2. Run skill: `/adr-generate {module}`
3. Agent generates: `docs/adrs/generated/{module}/ADR-XXX-{name}.md`
4. Renumber and move to: `docs/adrs/{module}/ADR-{N}-{name}.md`
5. Update `docs/adrs/INDEX.md`

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork** the repository
2. Create a **feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. Open a **Pull Request**

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test updates
- `chore:` Maintenance tasks

### Code Quality Checklist

Before submitting a PR:

- [ ] Code follows project style guide
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] ESLint shows no errors
- [ ] TypeScript compiles without errors
- [ ] All tests passing (`pnpm test`)

## License

This project is proprietary software. All rights reserved.

## Support

For questions or issues:

- Open an issue on GitHub
- Check existing [documentation](docs/)
- Review [ADRs](docs/adrs/INDEX.md) for architecture context

---

**Built with** [NestJS](https://nestjs.com) **and** [GraphQL](https://graphql.org)
