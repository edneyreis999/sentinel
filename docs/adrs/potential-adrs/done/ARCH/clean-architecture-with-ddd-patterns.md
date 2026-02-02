# Potential ADR: Clean Architecture with DDD Patterns

## Context

The Sentinel project needs a scalable, maintainable architecture for the backend GraphQL server. The project references the `gateway-financeiro-api` module which implements mature Clean Architecture patterns with Domain-Driven Design.

## Decision

Adopt **Clean Architecture** with **Domain-Driven Design** patterns for the NestJS backend.

### Architectural Layers

1. **Domain Layer** (core): Entities, Aggregates, Value Objects, Domain Events, Output Ports (Repository interfaces)
2. **Application Layer** (core): Use Cases, Input Ports, DTOs (Input/Output), Application Services
3. **Infrastructure Layer** (infra): Repository implementations, Mappers, External service adapters
4. **Nest-Modules Layer** (presentation): Controllers/Resolvers, Presenters, Providers, DI configuration

### Dependency Rule

The core (Domain + Application) **NEVER** depends on frameworks:

| Camada | Pode Depender De | NÃO Pode Depender De |
|--------|------------------|---------------------|
| Domain | Apenas si mesma | NestJS, Prisma, Express, TypeORM |
| Application | Domain + Shared | NestJS, Prisma, Express |
| Infrastructure | Domain + Application | Todos os frameworks |
| Nest-Modules | Application Ports | Domain (apenas interfaces) |

### Key Patterns

1. **Value Objects (VOs)**: Aggregates use encapsulated VOs instead of primitives (e.g., `Referencia`, `TotalDevido`)
2. **Input/Output Ports**: Interfaces for use cases (Input) and repositories (Output)
3. **Symbol-based DI Tokens**: Unique tokens using `Symbol()` instead of strings
4. **Repository with Mapper**: Separate mapper classes for domain ↔ persistence conversion
5. **Factory Methods in OutputDTOs**: Static methods `fromDomain()` for aggregate conversion
6. **State Machine**: Status transitions with validation logic in aggregates
7. **Structured Logging**: All use cases include structured logging

## Consequences

**Positive:**
- Clear separation of concerns
- Domain logic isolated from frameworks
- Highly testable through interfaces
- Easy to swap implementations
- SOLID principles enforced

**Negative:**
- More boilerplate code
- Steeper learning curve
- Initial development slower

## Alternatives Considered

1. **Standard NestJS Architecture**: Too coupled to framework, difficult to test domain logic in isolation
2. **Onion Architecture**: Similar but with different layer naming; Clean Architecture is more explicit
3. **Hexagonal Architecture**: Focuses more on ports/adapters; less emphasis on domain layer

## References

- Robert C. Martin - Clean Architecture
- `gateway-financeiro-api/src/core/faturamento` (reference implementation)
- GUIDELINES: `planos/019-add-Clean-arc-and-SOLID-faturamento-nest-modules/GUIDELINES-NEST-MODULES.md`
