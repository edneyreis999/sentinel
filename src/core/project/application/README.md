# Application Layer - Project Module

## Overview

This is the **Application Layer** for the Project module, following **Clean Architecture** with **Domain-Driven Design (DDD)** patterns as defined in [ADR-001](../../../../../../docs/adrs/ARCH/ADR-001-clean-architecture-with-ddd-patterns.md).

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        NEST MODULES LAYER                        │
│                   (Controllers, Resolvers)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │ calls
┌────────────────────────────▼────────────────────────────────────┐
│                      APPLICATION LAYER                           │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐ │
│  │   DTOs       │  │   Use Cases   │  │ Application Services │ │
│  │ (Input/Output)│  │  (Business    │  │  (Orchestration)     │ │
│  │              │  │   Logic)      │  │                      │ │
│  └──────────────┘  └───────┬───────┘  └──────────┬───────────┘ │
│                             │                      │             │
│                             │ uses                 │             │
│                      ┌──────▼──────────────────────▼───────┐    │
│                      │         Ports (Interfaces)           │    │
│                      │    IProjectRepository (Output Port)  │    │
│                      └──────────────────────┬───────────────┘    │
└────────────────────────────────────────────┼─────────────────────┘
                                             │ implements
┌────────────────────────────────────────────▼─────────────────────┐
│                     INFRASTRUCTURE LAYER                          │
│              (PrismaProjectRepository, etc.)                      │
└───────────────────────────────────────────────────────────────────┘
```

## Structure

```
src/core/project/application/
├── __tests__/                    # Test files
│   ├── _fakes/                   # Test doubles (FakeBuilders, etc.)
│   │   ├── create-project.input.fake-builder.ts
│   │   ├── create-project.output.fake-builder.ts
│   │   └── project.repository.fake.ts
│   ├── create-project.use-case.spec.ts          # Unit tests
│   ├── get-project.use-case.spec.ts             # Unit tests
│   ├── project.service.spec.ts                  # Unit tests
│   └── create-project.use-case.integration.spec.ts  # Integration tests
├── dto/                           # Data Transfer Objects
│   ├── create-project.input.dto.ts   # Input validation
│   ├── create-project.output.dto.ts  # Output shape
│   └── index.ts
├── ports/                         # Repository interfaces (Output Ports)
│   ├── project.repository.port.ts
│   └── index.ts
├── use-cases/                     # Business logic (Application Logic)
│   ├── create-project.use-case.ts
│   ├── get-project.use-case.ts
│   └── index.ts
├── services/                      # Orchestration layer
│   ├── project.service.ts
│   └── index.ts
└── index.ts
```

## Key Concepts

### 1. DTOs (Data Transfer Objects)

- **Input DTO**: Validates incoming data (e.g., `CreateProjectInput`)
- **Output DTO**: Defines response shape (e.g., `CreateProjectOutput`)
- Uses **Zod** for runtime validation

### 2. Ports (Interfaces)

Define contracts that the Infrastructure Layer must implement:

```typescript
interface IProjectRepository {
  existsByPath(path: string): Promise<boolean>;
  create(data: {...}): Promise<CreateProjectOutput>;
  findById(id: string): Promise<CreateProjectOutput | null>;
  updateLastOpened(id: string): Promise<void>;
}
```

### 3. Use Cases

Contain **application business logic** - orchestrate between domain and infrastructure:

- **Framework-agnostic**: No NestJS, no Prisma, no Express
- **Depend on abstractions**: Depend on Ports, not implementations
- **Enforce business rules**: e.g., "Project path must be unique"

### 4. Application Services

Orchestrate multiple use cases:

- Provide high-level API
- No business logic (delegate to use cases)
- Coordinate workflows

## Testing Strategy

### Unit Tests

- **Purpose**: Test single use case/service in isolation
- **Doubles**: Use mocked repositories (verify calls)
- **Location**: `__tests__/*.spec.ts`

Example:
```typescript
describe('CreateProjectUseCase', () => {
  it('should throw DomainError when project path already exists', async () => {
    // Arrange
    jest.spyOn(repository, 'existsByPath').mockResolvedValue(true);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
  });
});
```

### Integration Tests

- **Purpose**: Test integration between use case and fake repository
- **Doubles**: Use fake repositories (real behavior, in-memory)
- **Location**: `__tests__/*.integration.spec.ts`

Example:
```typescript
describe('CreateProjectUseCase - Integration', () => {
  it('should complete full create workflow', async () => {
    // Act
    const result = await useCase.execute(input);

    // Assert - Verify project was actually stored
    const stored = await repository.findById(result.id);
    expect(stored).toBeDefined();
  });
});
```

### FakeBuilders

Provide fluent interface for test data:

```typescript
const input = CreateProjectInputFakeBuilder.create()
  .withName('Test Project')
  .withPath('/test/path')
  .build();
```

## Coverage

- **Use Cases**: 100% coverage
- **Services**: 100% coverage
- **Test Files**: 45 tests, all passing

## Dependency Rule

**Critical**: Application Layer MUST NOT depend on:
- ❌ NestJS (@nestjs/*)
- ❌ Prisma (@prisma/*)
- ❌ Express
- ❌ Any external framework

Application Layer MAY depend on:
- ✅ Domain Layer (entities, value objects, errors)
- ✅ Zod (validation library - no framework coupling)
- ✅ TypeScript standard library

## Usage Example

```typescript
// In NestJS Controller/Resolver (outer layer)
@Controller('projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
  ) {}

  @Post()
  async create(@Body() input: CreateProjectInput) {
    return this.projectService.createProject(input);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.projectService.getProject(id);
  }
}
```

## Related Documentation

- [ADR-001: Clean Architecture with DDD](../../../../../../docs/adrs/ARCH/ADR-001-clean-architecture-with-ddd-patterns.md)
- [Shared Domain Errors](../shared/domain/errors/README.md)
- [Infrastructure Implementation](../../infrastructure/) - TODO
