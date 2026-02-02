# ADR-XXX: FakeBuilder with PropOrFactory Pattern for Test Data Generation

**Status:** Accepted
**Date:** 2026-01-31

## Context and Problem Statement

Testing DDD aggregates with multiple properties requires flexible test data generation strategies. Standard fixture approaches, static objects, and Object Mother patterns introduce rigidity that makes test maintenance cumbersome when domain models evolve. The research document "IA para Testes Eficientes em TypeScript" identifies that verbose test setup code increases token consumption for AI agents and creates fragile tests that break when interfaces change.

The problem centers on three key pain points: test data boilerplate obscures test intent, rigid fixtures cannot generate dynamic values for each test run, and interface changes cascade across hundreds of test files. This is particularly problematic in DDD contexts where aggregates contain numerous properties, and tests must validate specific behaviors while providing sensible defaults for remaining fields.

## Decision Drivers

- Maintainability: Interface changes should require minimal test updates
- Flexibility: Support both static values and dynamic factory functions for unique data generation
- Test clarity: Test code must focus on behavior under test, not data setup
- Token efficiency: Reduce boilerplate to optimize AI-assisted testing workflows
- Immutability: Prevent test state leakage between test executions
- Developer experience: Fluent, chainable API for readable test arrangements

## Considered Options

1. **FakeBuilder with PropOrFactory pattern** (Chosen)
2. **Static fixtures / Object Mother pattern**
3. **Inline test data literals**

## Decision Outcome

Chosen option: FakeBuilder with PropOrFactory pattern, because it encapsulates default values within the builder, supports dynamic value generation through factory functions, and isolates interface evolution to a single builder class per entity. This approach directly addresses token efficiency concerns by reducing test setup from multi-line object literals to concise method chains.

The PropOrFactory type definition enables properties to accept either static values or functions that generate values based on an index parameter. This allows a single builder instance to generate multiple unique entities through buildMany(), while the chainable API with `with*` methods lets tests override only the properties relevant to the scenario being validated.

## Pros and Cons of the Options

### FakeBuilder with PropOrFactory

**Pros:**
- Interface changes isolated to builder class, preventing cascade of test file updates
- Dynamic value generation eliminates test data collisions and supports realistic test scenarios
- Fluent chainable API reduces test setup code by 60-80% compared to inline objects
- Single builder instance can generate multiple unique entities through factory functions
- Immutable build output prevents test state leakage between test cases

**Cons:**
- Initial setup requires creating a builder class for each entity type
- Builder classes require maintenance when new properties are added to aggregates
- More boilerplate than simple fixtures for trivial test scenarios

### Static fixtures / Object Mother pattern

**Pros:**
- Simple to implement for basic use cases
- Familiar pattern for developers transitioning from other languages

**Cons:**
- Cannot generate dynamic values, leading to test data collisions
- Inflexible: creating variations requires multiple factory methods
- Interface changes require updates across all factory methods and test files
- Does not scale with complex entities having many property combinations

### Inline test data literals

**Pros:**
- No additional classes or infrastructure required
- Test data is immediately visible in the test method

**Cons:**
- Maximum verbosity obscures test intent
- Interface changes cascade across all test files using the literal
- Prone to copy-paste errors and inconsistent test data
- Poor token efficiency for AI-assisted test generation

## Consequences

Adopting FakeBuilder with PropOrFactory establishes a consistent pattern for test data generation across the codebase. The immediate impact is reduced test maintenance overhead, as interface changes only require updating the corresponding builder class rather than dozens of test files. The chainable API makes tests more readable by focusing on the specific properties being tested while relying on sensible defaults for remaining fields.

The pattern supports AI-assisted testing workflows by minimizing token consumption during code generation. AI agents can generate concise test arrangements using the builder API instead of verbose object literals, allowing more context to fit within token limits and improving inference quality. The research document indicates this reduces test setup code by 60-80%, directly addressing token efficiency concerns.

The dependency on random data generation libraries (Chance.js) for realistic test values introduces a requirement for deterministic test behavior. Tests using random factories must either accept non-deterministic data or seed the random generator. The pattern also requires discipline to maintain builders as entities evolve, though this cost is lower than updating scattered inline literals.

## References

- `docs/pesquisas/IA para Testes Eficientes em TypeScript.md:26-58` (FakeBuilder pattern rationale and token efficiency)
- `planos/001-kick-start/RELATORIO-arquitetura-clean-architecture.md:3.7` (Testing strategy reference)
