# Development Guide

This guide covers everything you need to know for local development on the Sentinel project.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Development Workflow](#development-workflow)
- [Code Structure](#code-structure)
- [Testing](#testing)
- [Debugging](#debugging)
- [GraphQL Development](#graphql-development)
- [Database Management](#database-management)
- [Adding New Features](#adding-new-features)

## Prerequisites

Before starting development, ensure you have:

- **Node.js** 20.x or higher ([nvm](https://github.com/nvm-sh/nvm) recommended)
- **pnpm** 10.x or higher
- **Git** for version control
- **VS Code** (recommended) with the following extensions:
  - ESLint
  - Prettier
  - GraphQL
  - Prisma

### Installing pnpm

```bash
npm install -g pnpm@10
```

### Installing Node.js with nvm

```bash
nvm install 20
nvm use 20
```

## Initial Setup

```bash
# Clone the repository
git clone https://github.com/coreto/sentinel.git
cd sentinel

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Generate Prisma Client
pnpm prisma:generate

# Run database migrations
pnpm prisma:migrate

# Start development server
pnpm start:dev
```

The GraphQL API will be available at `http://localhost:4000/graphql`

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation changes
- `test/` - Test updates

### 2. Make Changes and Test

```bash
# Watch mode for development
pnpm start:dev

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Lint and format
pnpm lint
pnpm format
```

### 3. Commit Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat: add user authentication"
```

Commit types:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test updates
- `chore:` Maintenance tasks

### 4. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Structure

The project follows **Domain-Driven Design (DDD)** and **Clean Architecture**:

```
src/
├── core/                      # Domain Layer (DDD)
│   ├── recent-projects/       # Domain entities, value objects
│   ├── user-preferences/      # Domain logic
│   ├── simulation-history/    # Business rules
│   └── shared/                # Shared utilities
├── nest-modules/              # Infrastructure Layer
│   ├── app/                   # App module
│   ├── recent-projects-module/# GraphQL resolvers
│   ├── user-preferences-module/
│   └── simulation-history-module/
├── database/                  # Database services
│   ├── prisma.module.ts       # Prisma service
│   └── prisma.service.ts      # Prisma client wrapper
├── graphql/                   # Generated GraphQL schema
└── main.ts                    # Entry point
```

### Layer Responsibilities

1. **Domain Layer (`core/`)**: Pure business logic, no framework dependencies
2. **Application Layer**: Use cases orchestrate domain logic
3. **Infrastructure Layer (`nest-modules/`)**: GraphQL, database, external services
4. **Presentation Layer**: GraphQL resolvers and models

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

### E2E Tests

```bash
pnpm test:e2e
```

### Test Structure

```
src/
├── **/__tests__/              # Unit tests
│   ├── *.spec.ts
│   └── *.e2e-spec.ts
test/
└── **/*.e2e-spec.ts           # Global E2E tests
```

### Writing Tests

- Use **FakeBuilder** pattern for test data (see `TEST-001` ADR)
- Mock external dependencies
- Test domain logic in isolation
- Use Jest matchers

```typescript
describe('UserService', () => {
  it('should create a user', async () => {
    const user = FakeBuilder.user().withName('John').build();
    const result = await service.create(user);
    expect(result.name).toBe('John');
  });
});
```

## Debugging

### VS Code Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug NestJS",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["start:debug"],
      "console": "integratedTerminal",
      "restart": true
    }
  ]
}
```

### Command Line Debugging

```bash
pnpm start:debug
```

Then connect with your debugger to `localhost:9229`.

### Debugging Tests

```bash
pnpm test:debug
```

## GraphQL Development

### Apollo Sandbox

Access the interactive GraphQL playground at `http://localhost:4000/graphql`

### GraphQL Schema

The schema is auto-generated from TypeScript decorators. View the generated schema at:

```
src/graphql/schema.graphql
```

### Adding GraphQL Operations

1. Define GraphQL types in `*.model.ts`
2. Create resolvers in `*.resolver.ts`
3. Add queries/mutations/subscriptions with decorators:

```typescript
@Resolver(() => UserPreferences)
export class UserPreferencesResolver {
  @Query(() => UserPreferences)
  async userPreferences(): Promise<UserPreferences> {
    // Implementation
  }

  @Mutation(() => UserPreferences)
  async updateUserPreferences(
    @Args('input') input: UpdateUserPreferencesInput,
  ): Promise<UserPreferences> {
    // Implementation
  }

  @Subscription(() => UserPreferences)
  async userPreferencesChanged(): Promise<AsyncIterator<UserPreferences>> {
    // Implementation
  }
}
```

### GraphQL Subscriptions

Subscriptions use WebSocket for real-time updates:

```typescript
@Subscription(() => SimulationStatus)
async simulationStatusChanged(
  @Args('simulationId') simulationId: string,
): Promise<AsyncIterator<SimulationStatus>> {
  return this.pubSub.asyncIterator(`SIMULATION_${simulationId}`);
}
```

## Database Management

### Prisma Studio

Browse and edit database data:

```bash
pnpm prisma:studio
```

Opens at `http://localhost:5555`

### Creating Migrations

```bash
# Create a new migration
pnpm prisma:migrate

# Reset database (deletes all data)
pnpm prisma:reset

# Generate Prisma Client
pnpm prisma:generate
```

### Database Schema

Edit `prisma/schema.prisma` to modify the database schema:

```prisma
model RecentProject {
  id          String   @id @default(uuid())
  name        String
  path        String   @unique
  gameVersion String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Adding New Features

### Using NestJS CLI

```bash
# Generate a new module
nest g module my-feature

# Generate a resolver
nest g resolver my-feature

# Generate a service
nest g service my-feature
```

### Feature Checklist

When adding a new feature:

- [ ] Create domain layer in `src/core/`
- [ ] Create use cases for application logic
- [ ] Create GraphQL resolvers in `src/nest-modules/`
- [ ] Add tests (unit + E2E)
- [ ] Update GraphQL schema documentation
- [ ] Run linting and formatting
- [ ] Ensure tests pass

### Example: Adding a New Module

```bash
# 1. Generate NestJS module
nest g module notes
nest g resolver notes
nest g service notes

# 2. Create domain entities
mkdir -p src/core/notes
touch src/core/notes/note.entity.ts
touch src/core/notes/note.value-object.ts

# 3. Implement use cases
touch src/core/notes/use-cases/create-note.use-case.ts

# 4. Wire up in resolver
# Edit src/nest-modules/notes/notes.resolver.ts

# 5. Add tests
touch src/core/notes/__tests__/note.entity.spec.ts
touch test/notes.e2e-spec.ts

# 6. Run tests
pnpm test
pnpm test:e2e
```

## Code Quality

### Linting

```bash
# Run ESLint
pnpm lint

# Auto-fix issues
pnpm lint --fix
```

### Formatting

```bash
# Format with Prettier
pnpm format
```

### Type Checking

```bash
# Type check without emitting
npx tsc --noEmit
```

## Troubleshooting

### Common Issues

**Prisma Client not generated:**

```bash
pnpm prisma:generate
```

**Database connection errors:**

Check your `.env` file and ensure PostgreSQL is running.

**Port already in use:**

Change the port in `.env`:

```env
PORT=4001
```

**Tests failing:**

```bash
# Clean and reinstall
rm -rf node_modules dist
pnpm install
pnpm build
```

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [GraphQL Documentation](https://graphql.org/learn/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Project ADRs](docs/adrs/INDEX.md)

## Contributing Guidelines

See [CONTRIBUTING.md](../CONTRIBUTING.md) for detailed contribution guidelines.

### Code Review Process

1. All PRs require at least one approval
2. CI checks must pass
3. Code coverage must not decrease
4. Documentation must be updated

### Getting Help

- Open an issue on GitHub
- Check existing [documentation](docs/)
- Review [ADRs](docs/adrs/INDEX.md) for architecture context
- Ask in team discussions

---

**Happy Coding!**
