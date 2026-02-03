# Contributing to Sentinel

Thank you for your interest in contributing to Sentinel! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow:

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other contributors

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- pnpm 10.x or higher
- Docker (optional, for containerized development)
- Git

### Initial Setup

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/sentinel.git
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

For detailed development setup, see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Development Workflow

### 1. Create a Branch

Create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming conventions:

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation changes
- `test/` - Test updates
- `chore/` - Maintenance tasks

### 2. Make Your Changes

- Write clean, readable code
- Follow the project's coding standards
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run linting
pnpm lint

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Type check
npx tsc --noEmit
```

### 4. Commit Your Changes

Follow the [Commit Guidelines](#commit-guidelines) below.

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Coding Standards

### TypeScript

- Use **strict mode** (enabled in `tsconfig.json`)
- Avoid `any` types (use `unknown` when appropriate)
- Use type inference when possible
- Prefer interfaces for object shapes
- Use enums for fixed sets of values

```typescript
// Good
interface User {
  id: string;
  name: string;
}

const user: User = { id: '1', name: 'John' };

// Bad
const user: any = { id: '1', name: 'John' };
```

### Naming Conventions

- **Files:** kebab-case (`user-preferences.service.ts`)
- **Classes:** PascalCase (`UserPreferencesService`)
- **Functions/Variables:** camelCase (`getUserPreferences`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Private members:** prefix with underscore (`_privateMethod`)

### Code Organization

Follow the **Domain-Driven Design (DDD)** structure:

```
src/
├── core/                      # Domain layer
│   └── your-feature/
│       ├── entities/
│       ├── value-objects/
│       └── use-cases/
├── nest-modules/              # Infrastructure layer
│   └── your-feature-module/
│       ├── resolvers/
│       ├── services/
│       └── models/
└── database/                  # Database layer
```

### Error Handling

- Use domain-specific errors when appropriate
- Always handle errors in async functions
- Provide meaningful error messages

```typescript
// Good
try {
  await this.service.createUser(input);
} catch (error) {
  if (error instanceof UserAlreadyExistsError) {
    throw new ConflictException(error.message);
  }
  throw error;
}

// Bad
try {
  await this.service.createUser(input);
} catch (error) {
  // Silently swallowing errors
}
```

### Commenting

- Write self-documenting code
- Use JSDoc for public APIs
- Comment complex logic
- Keep comments up to date

```typescript
/**
 * Creates a new user with validation
 * @param input - User creation input
 * @returns Created user entity
 * @throws UserAlreadyExistsError if user with email exists
 */
async createUser(input: CreateUserInput): Promise<User> {
  // Implementation
}
```

## Commit Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

### Commit Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Test updates
- `chore:` Maintenance tasks
- `perf:` Performance improvements

### Examples

```bash
feat(user-preferences): add theme selection
fix(simulation): resolve race condition in status updates
docs(readme): update installation instructions
test(e2e): add tests for GraphQL subscriptions
```

### Commit Message Best Practices

- Use the imperative mood ("add" not "added" or "adds")
- Limit the first line to 72 characters
- Reference issues in the footer: `Closes #123`
- Explain **what** and **why**, not **how**

## Pull Request Process

### Before Submitting

Ensure your PR:

- [ ] Passes all CI checks
- [ ] Includes tests for new functionality
- [ ] Updates documentation
- [ ] Follows coding standards
- [ ] Has a clear description of changes
- [ ] References related issues

### PR Description Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] All tests passing

## Checklist

- [ ] Code follows project style
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Added tests for changes
```

### Review Process

1. **Automated Checks**: CI runs linting, tests, and type checking
2. **Code Review**: At least one maintainer must review and approve
3. **Changes**: Address feedback from reviewers
4. **Approval**: PR approved and ready to merge
5. **Merge**: Maintainer merges the PR

## Testing Guidelines

### Unit Tests

- Test domain logic in isolation
- Use FakeBuilder for test data
- Mock external dependencies
- Aim for high coverage (>80%)

```typescript
describe('UserService', () => {
  it('should create a user', async () => {
    // Arrange
    const input = FakeBuilder.userInput().build();

    // Act
    const result = await service.create(input);

    // Assert
    expect(result.name).toBe(input.name);
  });
});
```

### E2E Tests

- Test complete user flows
- Use real database (test instance)
- Test GraphQL queries/mutations
- Test error scenarios

```typescript
describe('User E2E', () => {
  it('should create user via GraphQL', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation CreateUser($input: CreateUserInput!) {
            createUser(input: $input) {
              id
              name
            }
          }
        `,
        variables: { input: { name: 'John' } },
      });

    expect(response.body.data.createUser.name).toBe('John');
  });
});
```

### Test Data

Use the **FakeBuilder** pattern (see [TEST-001 ADR](docs/adrs/TEST/ADR-001-fakebuilder-with-proporfactory-pattern.md)):

```typescript
const user = FakeBuilder.user().withName('John').withEmail('john@example.com').build();
```

## Documentation

### When to Update Documentation

Update documentation when:

- Adding new features
- Changing existing functionality
- Updating configuration
- Modifying GraphQL schema
- Changing deployment process

### Documentation Files

- **README.md**: Project overview and quick start
- **docs/DEVELOPMENT.md**: Development setup and workflow
- **docs/DOCKER.md**: Docker deployment guide
- **docs/adrs/INDEX.md**: Architecture decision records

### GraphQL Documentation

- Add JSDoc comments to GraphQL types
- Include example queries in docstrings
- Document input/output types

```typescript
/**
 * User preferences with theme and language settings
 */
@ObjectType()
export class UserPreferences {
  /**
   * User's preferred theme (LIGHT or DARK)
   */
  @Field(() => Theme)
  theme: Theme;

  /**
   * User's preferred language (e.g., "en-US")
   */
  @Field()
  language: string;
}
```

## Architecture Guidelines

### Domain-Driven Design

This project follows DDD principles. When contributing:

- Keep domain logic framework-agnostic
- Use value objects for concepts without identity
- Aggregate related entities
- Define clear boundaries between contexts

### Clean Architecture

Follow the layer separation:

1. **Domain Layer**: Pure business logic
2. **Application Layer**: Use cases orchestrate domain
3. **Infrastructure Layer**: External concerns (GraphQL, DB)
4. **Presentation Layer**: GraphQL resolvers

### Dependency Inversion

- Depend on abstractions, not concretions
- Use DI tokens (see [DI-001 ADR](docs/adrs/DI/ADR-001-symbol-based-di-tokens.md))

```typescript
// Good
constructor(
  @Inject(USER_REPOSITORY)
  private readonly userRepo: IUserRepository,
) {}

// Bad
constructor(
  private readonly userRepo: PrismaUserRepository,
) {}
```

## Getting Help

- **Documentation**: Check [docs/](docs/) for detailed guides
- **ADRs**: Review [docs/adrs/INDEX.md](docs/adrs/INDEX.md) for architecture context
- **Issues**: Search existing issues before creating new ones
- **Discussions**: Use GitHub Discussions for questions

## Recognition

Contributors will be recognized in:

- CONTRIBUTORS.md file
- Release notes for significant contributions
- Project documentation for major features

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Sentinel! Your contributions help make this project better for everyone.
