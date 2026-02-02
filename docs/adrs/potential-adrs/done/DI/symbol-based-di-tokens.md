# Potential ADR: Symbol-based DI Tokens in NestJS

## Context

NestJS Dependency Injection uses tokens to register and inject providers. Using string-based tokens can lead to naming collisions, especially in larger applications with multiple modules.

## Decision

Use **Symbol()** for all custom DI tokens in NestJS modules instead of strings.

### Implementation

**Before (String-based - WRONG):**
```typescript
export const ICreateFaturaUseCase = 'ICreateFaturaUseCase';

@Module({
  providers: [
    {
      provide: ICreateFaturaUseCase,
      useClass: CreateFaturaUseCase,
    },
  ],
})
```

**After (Symbol-based - CORRECT):**
```typescript
export const ICreateSimulationHistoryUseCaseToken = Symbol('ICreateSimulationHistoryUseCase');

@Module({
  providers: [
    {
      provide: ICreateSimulationHistoryUseCaseToken,
      useClass: CreateSimulationHistoryUseCase,
    },
  ],
})
```

### Usage in Controllers

Controllers use type imports (interfaces) with Symbol tokens:

```typescript
import type { ICreateSimulationHistoryUseCase } from './ports/in';

@Controller()
export class SimulationHistoryController {
  constructor(
    @Inject(ICreateSimulationHistoryUseCaseToken)
    private readonly createUseCase: ICreateSimulationHistoryUseCase,
  ) {}
}
```

### Providers File

Centralized provider configuration in `*.providers.ts`:

```typescript
export const simulationHistoryProviders = [
  {
    provide: ICreateSimulationHistoryUseCaseToken,
    useClass: CreateSimulationHistoryUseCase,
  },
  {
    provide: ISimulationHistoryRepositoryToken,
    useClass: SimulationHistoryPrismaRepository,
  },
  // Logger, etc.
];
```

## Consequences

**Positive:**
- Guaranteed unique tokens (Symbols are unique by design)
- Prevents naming collisions across modules
- Type-safe dependency injection
- Explicit dependency registration

**Negative:**
- Slightly more verbose than strings
- Requires token export/import management

## Alternatives Considered

1. **String-based tokens**: Simpler but prone to collisions
2. **Class-based tokens**: Works but couples to implementation
3. **No tokens (direct useClass)**: Cannot swap implementations

## References

- Report: `planos/001-kick-start/RELATORIO-arquitetura-clean-architecture.md` (Section 3.4)
