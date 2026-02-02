# ADR-XXX: Symbol-based DI Tokens for NestJS Dependency Injection

**Status:** Accepted
**Date:** 2026-02-01
**Related ADRs:** RAG/ADR-001 (NestJS Monolithic Architecture)

---

## Context and Problem Statement

NestJS Dependency Injection system requires tokens to register and inject providers in the IoC container. The traditional approach of using string-based tokens creates risk of naming collisions in modular applications with multiple bounded contexts, especially as the codebase scales and different teams may introduce conflicting token names.

The Sentinel RAG system follows Clean Architecture principles with strict layer separation. Controllers depend on interfaces (type imports) rather than concrete implementations, requiring a reliable token mechanism for dependency registration. String-based tokens compromise type safety and can cause runtime injection errors when duplicate names accidentally collide across modules.

## Decision Drivers

- Prevention of naming collisions across modules and bounded contexts
- Type safety in dependency injection with compile-time verification
- Explicit dependency registration aligned with Clean Architecture Dependency Inversion Principle
- Support for interface-based controller dependencies without concrete class coupling
- NestJS best practices for token-based provider registration

## Considered Options

1. **Symbol-based tokens** (chosen approach)
2. **String-based tokens**
3. **Class-based tokens**

## Decision Outcome

Chosen option: **Symbol-based tokens**, because Symbols are guaranteed unique by design in JavaScript runtime, eliminating collision risk in modular applications. The approach aligns with NestJS recommended patterns for custom tokens and enables interface-only dependencies in controllers while maintaining type-safe injection through Symbol tokens.

The implementation uses Symbol tokens exported from dedicated `tokens.ts` files in each module's application layer. Controllers import interface types separately from implementation tokens, preserving Clean Architecture layer separation. Centralized provider arrays in `*.providers.ts` files register all module dependencies using these Symbol tokens.

## Pros and Cons of the Options

### Symbol-based Tokens

**Pros:**
- Guaranteed uniqueness prevents naming collisions across modules
- Type-safe injection when combined with interface type imports
- Enables interface-only controller dependencies without concrete coupling
- Explicit token exports make dependencies discoverable
- Aligned with NestJS documentation for custom provider tokens

**Cons:**
- Requires separate token management (exports/imports)
- Slightly more verbose than string literals
- Token naming conventions require discipline

### String-based Tokens

**Pros:**
- Simple syntax with direct string literals
- No separate token files needed
- Familiar pattern from Angular and other DI frameworks

**Cons:**
- High risk of naming collisions in large codebases
- No compile-time verification of token correctness
- Runtime injection errors may surface late in testing
- Typos in token names create silent failures

### Class-based Tokens

**Pros:**
- Natural TypeScript type checking
- No separate token management needed

**Cons:**
- Couples DI token to concrete implementation class
- Violates Dependency Inversion Principle
- Prevents interface-only controller dependencies
- Cannot swap implementations without changing token

## Consequences

**Architectural Benefits**: Symbol tokens enforce the Dependency Inversion Principle by decoupling the injection mechanism from concrete implementations. Controllers depend on interfaces for type safety while using Symbol tokens for runtime resolution, maintaining Clean Architecture layer boundaries.

**Development Impact**: Teams must create `tokens.ts` files in each module's `application/ports/` directory, following the naming convention `{InterfaceName}Token`. Provider configuration becomes more explicit through centralized `*.providers.ts` arrays that list all module dependencies with their Symbol tokens.

**Migration Considerations**: Existing string-based tokens require replacement with Symbol equivalents. The migration path is straightforward - create Symbol token constant, replace string references in providers, update controller `@Inject()` decorators. No behavioral changes to injected services occur during migration.

## References

- `planos/001-kick-start/RELATORIO-arquitetura-clean-architecture.md:95-107` (Section 3.4: DI Tokens com Symbol)
- `planos/001-kick-start/RELATORIO-arquitetura-clean-architecture.md:310-312` (Token file structure in application/ports)
- `planos/001-kick-start/RELATORIO-arquitetura-clean-architecture.md:340-347` (Providers configuration with Symbol tokens)
- `planos/001-kick-start/RELATORIO-arquitetura-clean-architecture.md:210-229` (Controller type imports with Symbol injection)
