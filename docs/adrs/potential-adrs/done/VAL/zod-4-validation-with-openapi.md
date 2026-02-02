# Potential ADR: Zod 4 for Validation with OpenAPI Integration

## Context

The Sentinel backend needs runtime type validation for GraphQL inputs and outputs. TypeScript provides compile-time safety but runtime validation is still needed for external data.

Zod 4 was released in January 2026 with 2x performance improvements over v3.

## Decision

Adopt **Zod 4** as the validation library with OpenAPI integration for API documentation.

### Technology Stack

- **Validation**: Zod 4.3.6+
- **OpenAPI**: @asteasolutions/zod-to-openapi
- **GraphQL**: Integrates with @nestjs/graphql for argument validation

### Implementation

```typescript
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const SimulationStatusEnum = z
  .enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'])
  .openapi({
    description: 'Status da simulação no fluxo de execução',
    example: 'PENDING',
  });

export const CreateSimulationHistoryInputSchema = z.object({
  projectPath: z.string().min(1),
  projectName: z.string().min(1),
  status: SimulationStatusEnum,
  ttkVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  configJson: z.string(),
  summaryJson: z.string(),
  durationMs: z.number().int().positive(),
  battleCount: z.number().int().nonnegative(),
  trechoCount: z.number().int().nonnegative(),
});
```

### Validation in Use Cases

```typescript
export class CreateSimulationHistoryUseCase {
  async execute(input: CreateSimulationHistoryInput): Promise<SimulationHistoryEntryOutputDTO> {
    // Validate input
    const validatedInput = CreateSimulationHistoryInputSchema.parse(input);

    // Business logic...
  }
}
```

### OpenAPI Documentation

Schemas automatically generate OpenAPI documentation for the GraphQL API.

## Consequences

**Positive:**
- Runtime type safety
- TypeScript inference from schemas
- 2x faster than Zod v3
- Automatic OpenAPI docs
- Excellent error messages
- Composable schemas

**Negative:**
- Additional runtime overhead (minimal with Zod 4)
- Need to maintain schema alongside TypeScript types

## Alternatives Considered

1. **class-validator**: Decorator-based, less type-safe, requires decorators
2. **Joi**: No TypeScript inference
3. **Yup**: Slower, less maintained
4. **No validation**: Unsafe, can crash app

## References

- [Zod v4 Documentation](https://zod.dev/v4)
- [Zod v4 Release Notes](https://zod.dev/v4/release-notes)
- Report: `planos/001-kick-start/RELATORIO-arquitetura-clean-architecture.md`
