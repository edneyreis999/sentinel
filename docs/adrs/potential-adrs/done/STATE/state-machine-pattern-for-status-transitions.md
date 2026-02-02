# Potential ADR: State Machine Pattern for Status Transitions

## Context

Simulation history entries have status that transitions through multiple states (PENDING → RUNNING → COMPLETED/FAILED). Invalid transitions should be prevented at the domain level.

## Decision

Implement **State Machine pattern** directly in aggregates for status transition validation.

### Implementation

```typescript
export enum SimulationStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export class SimulationHistoryEntry extends AggregateRoot<SimulationHistoryEntryProps> {
  private _status: SimulationStatus;

  private constructor(props: SimulationHistoryEntryProps, id?: string) {
    super(props, id);
    this._status = props.status ?? SimulationStatus.PENDING;
  }

  canTransitionTo(newStatus: SimulationStatus): boolean {
    const transitions: Record<SimulationStatus, SimulationStatus[]> = {
      [SimulationStatus.PENDING]: [
        SimulationStatus.RUNNING,
        SimulationStatus.CANCELLED,
      ],
      [SimulationStatus.RUNNING]: [
        SimulationStatus.COMPLETED,
        SimulationStatus.FAILED,
        SimulationStatus.CANCELLED,
      ],
      [SimulationStatus.COMPLETED]: [], // Terminal state
      [SimulationStatus.FAILED]: [
        SimulationStatus.RUNNING, // Can retry
        SimulationStatus.CANCELLED,
      ],
      [SimulationStatus.CANCELLED]: [], // Terminal state
    };

    return transitions[this._status]?.includes(newStatus) ?? false;
  }

  private transitionTo(newStatus: SimulationStatus): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new InvalidStatusTransitionError(this._status, newStatus);
    }
    this._status = newStatus;
  }

  // Domain methods
  markAsRunning(): void {
    this.transitionTo(SimulationStatus.RUNNING);
  }

  markAsCompleted(summaryJson: string): void {
    this.transitionTo(SimulationStatus.COMPLETED);
    this.props.summaryJson = summaryJson;
  }

  markAsFailed(errorJson: string): void {
    this.transitionTo(SimulationStatus.FAILED);
    this.props.summaryJson = errorJson;
  }

  markAsCancelled(): void {
    this.transitionTo(SimulationStatus.CANCELLED);
  }

  // Getters
  get status(): SimulationStatus {
    return this._status;
  }
}
```

### Custom Domain Error

```typescript
export class InvalidStatusTransitionError extends DomainError {
  constructor(currentStatus: SimulationStatus, newStatus: SimulationStatus) {
    super(`Invalid status transition from ${currentStatus} to ${newStatus}`);
  }
}
```

### Usage in Use Cases

```typescript
export class UpdateSimulationStatusUseCase {
  async execute(input: UpdateSimulationStatusInput): Promise<void> {
    const entry = await this.repository.findById(input.id);

    if (!entry) {
      throw new NotFoundError('SimulationHistoryEntry', input.id);
    }

    switch (input.status) {
      case SimulationStatus.RUNNING:
        entry.markAsRunning();
        break;
      case SimulationStatus.COMPLETED:
        entry.markAsCompleted(input.summaryJson);
        break;
      case SimulationStatus.FAILED:
        entry.markAsFailed(input.summaryJson);
        break;
      case SimulationStatus.CANCELLED:
        entry.markAsCancelled();
        break;
    }

    await this.repository.update(entry);

    // Publish subscription event
    this.pubSub.publish('simulationStatusChanged', {
      simulationStatusChanged: SimulationHistoryEntryOutputDTO.fromDomain(entry),
    });
  }
}
```

## Consequences

**Positive:**
- Business rules enforced at domain level
- Invalid transitions impossible to execute
- Self-documenting (transition table shows valid states)
- Easy to add new states or transitions
- Testable in isolation

**Negative:**
- More code than simple status updates
- Need to maintain transition table

## Alternatives Considered

1. **Allow any transition**: Simpler but allows invalid states
2. **Status validation in use case**: Business logic leaks out of domain
3. **External state machine library**: Overkill for simple cases

## References

- Report: `planos/001-kick-start/RELATORIO-arquitetura-clean-architecture.md` (Section 3.8)
