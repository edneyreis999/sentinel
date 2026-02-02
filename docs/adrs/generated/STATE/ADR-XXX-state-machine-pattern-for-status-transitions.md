# ADR-XXX: State Machine Pattern for Status Transitions

**Status:** Accepted
**Date:** 2026-02-01

---

## Context and Problem Statement

Simulation history entries require status transitions through multiple states (PENDING → RUNNING → COMPLETED/FAILED/CANCELLED). The domain must prevent invalid transitions at the aggregate level to maintain business rule integrity, rather than relying on application-layer validation or database constraints.

The system follows Clean Architecture principles where domain aggregates encapsulate business logic. Status transitions represent core domain behavior—invalid state changes should be impossible through aggregate's public interface, ensuring data consistency regardless of where the aggregate is used (use cases, event handlers, tests).

## Decision Drivers

- Domain integrity requires invalid status transitions to be impossible at aggregate level
- Clean Architecture principles demand business rule enforcement within domain layer
- Self-documenting code: explicit transition table clarifies valid state flows
- Testability in isolation without infrastructure dependencies
- Easy extensibility for new states or transition rules without modifying use cases
- Reusability across different aggregates requiring similar state management

## Considered Options

1. **State Machine pattern in aggregates** (transition table with validation methods)
2. **Allow any transition** (simple status property with direct assignment)
3. **Status validation in use cases** (validation logic in application layer)

## Decision Outcome

Chosen option: **State Machine pattern in aggregates**, because it encapsulates transition rules within the domain, prevents invalid states through type safety, and maintains consistency with Clean Architecture's dependency rule. The aggregate owns its state transition logic, making invalid operations impossible at the compiler level.

The implementation uses a `canTransitionTo()` method that validates transitions against a declared transition table, coupled with semantic domain methods (`markAsRunning()`, `markAsCompleted()`) that internally call `transitionTo()`. Invalid transitions throw domain-specific errors (`InvalidStatusTransitionError`) rather than generic exceptions.

Terminal states (COMPLETED, CANCELLED) have empty transition arrays, preventing any further state changes. The FAILED state allows retry via transition back to RUNNING. This design enables retry logic while preventing accidental state manipulation.

## Pros and Cons of the Options

### State Machine Pattern in Aggregates

**Pros:**
- Business rules enforced at domain level, impossible to violate through any interface
- Self-documenting through explicit transition table showing valid state flows
- Easy to test in isolation without database or use case dependencies
- New states or transitions require changes only in aggregate, not across use cases
- Compile-time safety through semantic domain methods prevents accidental misuse
- Aligns with Clean Architecture's core principle of domain independence

**Cons:**
- More code than simple status property with direct assignment
- Transition table must be maintained as state machine evolves
- Requires creating custom domain error types for validation failures

### Allow Any Transition

**Pros:**
- Minimal code implementation (simple enum property with setter)
- No transition logic to maintain or test
- Maximum flexibility for ad-hoc status changes

**Cons:**
- No domain-level validation of state integrity
- Invalid states possible (e.g., PENDING → COMPLETED without RUNNING)
- Business logic leaks to use cases or database constraints
- Violates Clean Architecture by outsourcing domain rules
- Data consistency depends on developer discipline across all code paths

### Status Validation in Use Cases

**Pros:**
- Centralized validation logic visible in application layer
- Simpler aggregates with only state storage

**Cons:**
- Business logic leaks out of domain, violating Dependency Inversion Principle
- Validation must be duplicated across every use case that modifies status
- Event handlers or background jobs bypass validation if not disciplined
- Aggregate does not guarantee its own integrity
- Testing requires full use case setup rather than isolated unit tests

## Consequences

**Domain Integrity**: Aggregates guarantee valid state transitions through encapsulation. Invalid operations throw domain errors before state changes occur. This ensures consistency whether the aggregate is called from use cases, event handlers, or tests.

**Developer Experience**: Semantic domain methods (`markAsCompleted()`, `markAsFailed()`) provide clear intent compared to generic setters. The transition table serves as living documentation of state flow rules. IDE autocomplete guides developers to valid operations only.

**Extensibility**: Adding new states or transitions requires changes only in the aggregate's transition table. No use case modifications needed unless new state requires new domain method. This follows Open/Closed Principle—open for extension (new transitions), closed for modification (existing behavior unchanged).

**Retry Logic**: FAILED → RUNNING transition enables automatic retry workflows without special-casing. Background jobs can safely attempt status updates, knowing the aggregate will reject invalid transitions.

**Testing**: Isolated unit tests verify transition rules without database, use cases, or external dependencies. Tests cover valid paths, invalid transitions, and terminal state enforcement.

## References

- `planos/001-kick-start/RELATORIO-arquitetura-clean-architecture.md:161-181` (Section 3.8: State Machine pattern specification)
- `planos/001-kick-start/RELATORIO-arquitetura-clean-architecture.md:22-23` (Context: State Machine as identified pattern)
