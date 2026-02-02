# Potential ADR: FakeBuilder with PropOrFactory Pattern

## Context

Writing tests for DDD aggregates with many properties requires flexible test data builders. Standard fixture approaches are rigid and don't support dynamic value generation.

## Decision

Adopt **FakeBuilder** pattern with **PropOrFactory** for generating test data in DDD aggregates.

### Implementation

```typescript
type PropOrFactory<T> = T | ((index: number) => T);

export class SimulationHistoryEntryFakeBuilder {
  private _projectPath: PropOrFactory<string> = () => `/projects/${chance.word()}`;
  private _projectName: PropOrFactory<string> = () => chance.sentence({ words: 3 });
  private _status: PropOrFactory<SimulationStatus> = SimulationStatus.PENDING;
  private _ttkVersion: PropOrFactory<string> = () => '1.0.0';
  private _configJson: PropOrFactory<string> = () => JSON.stringify({});
  private _summaryJson: PropOrFactory<string> = () => JSON.stringify({});
  private _durationMs: PropOrFactory<number> = () => chance.integer({ min: 100, max: 10000 });
  private _battleCount: PropOrFactory<number> = 0;
  private _trechoCount: PropOrFactory<number> = 0;

  private static MAX_INSTANCES = 5;

  private count = 0;

  static the(limit: number = SimulationHistoryEntryFakeBuilder.MAX_INSTANCES): SimulationHistoryEntryFakeBuilder {
    return new SimulationHistoryEntryFakeBuilder(limit);
  }

  constructor(private limit: number = SimulationHistoryEntryFakeBuilder.MAX_INSTANCES) {}

  withProjectPath(valueOrFactory: PropOrFactory<string>): this {
    this._projectPath = valueOrFactory;
    return this;
  }

  withStatus(value: SimulationStatus): this {
    this._status = value;
    return this;
  }

  withBattleCount(value: number): this {
    this._battleCount = value;
    return this;
  }

  build(): SimulationHistoryEntry {
    const entry = SimulationHistoryEntry.create({
      projectPath: this.callFactory(this._projectPath, this.count),
      projectName: this.callFactory(this._projectName, this.count),
      status: this.callFactory(this._status, this.count),
      ttkVersion: this.callFactory(this._ttkVersion, this.count),
      configJson: this.callFactory(this._configJson, this.count),
      summaryJson: this.callFactory(this._summaryJson, this.count),
      durationMs: this.callFactory(this._durationMs, this.count),
      battleCount: this.callFactory(this._battleCount, this.count),
      trechoCount: this.callFactory(this._trechoCount, this.count),
      ... // other props
    });
    this.count++;
    return entry;
  }

  buildMany(count: number): SimulationHistoryEntry[] {
    return Array.from({ length: count }, () => this.build());
  }

  private callFactory<T>(valueOrFactory: PropOrFactory<T>, index: number): T {
    return typeof valueOrFactory === 'function'
      ? (valueOrFactory as (index: number) => T)(index)
      : valueOrFactory;
  }
}
```

### Usage in Tests

```typescript
describe('CreateSimulationHistoryUseCase', () => {
  it('should create a new simulation history entry', async () => {
    const entry = SimulationHistoryEntryFakeBuilder.the(1)
      .withProjectPath('/projects/test')
      .withStatus(SimulationStatus.RUNNING)
      .build();

    repository.save.mockResolvedValue(undefined);

    const output = await useCase.execute({
      projectPath: entry.projectPath,
      // ...
    });

    expect(output.id).toBeDefined();
  });
});
```

## Consequences

**Positive:**
- Flexible test data generation
- Supports both static values and dynamic factories
- Realistic test data with Chance.js
- Chainable API for readable tests
- Single instance can generate multiple unique entities

**Negative:**
- More boilerplate than simple fixtures
- Requires maintenance for new properties

## Alternatives Considered

1. **Static fixtures**: Simple but rigid, cannot generate dynamic data
2. **ObjectMother pattern**: Less flexible, no factory support
3. **Inline test data**: Repetitive, inconsistent across tests

## Dependencies

- Requires **Chance.js** for random data generation
- Works with any test framework (Jest, Vitest, etc.)

## References

- Report: `planos/001-kick-start/RELATORIO-arquitetura-clean-architecture.md` (Section 3.7)
