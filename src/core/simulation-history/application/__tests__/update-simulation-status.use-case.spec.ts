import { UpdateSimulationStatusUseCase } from '../use-cases/update-simulation-status.use-case';
import { SimulationHistoryEntryFakeBuilder } from '../../domain/__tests__/simulation-history-entry.fake-builder';
import { SimulationStatus } from '../../domain/value-objects';
import { NotFoundError, DomainError } from '@core/shared/domain/errors';
import { SimulationHistoryInMemoryRepository } from '../../infra/db/in-memory/simulation-history-in-memory.repository';

// Test constants for JSON payloads
const TEST_SUMMARY_JSON = JSON.stringify({
  result: 'success',
  metrics: { battles: 10, duration: 5000 },
});

const TEST_ERROR_JSON = JSON.stringify({
  error: 'Something went wrong',
  code: 'SIMULATION_ERROR',
  timestamp: '2026-02-03T10:00:00Z',
});

describe('UpdateSimulationStatusUseCase', () => {
  let useCase: UpdateSimulationStatusUseCase;
  let repository: SimulationHistoryInMemoryRepository;

  beforeEach(() => {
    repository = new SimulationHistoryInMemoryRepository();
    useCase = new UpdateSimulationStatusUseCase(repository);
  });

  it('should update status from PENDING to RUNNING', async () => {
    const entry = SimulationHistoryEntryFakeBuilder.anEntry()
      .withStatus(SimulationStatus.PENDING)
      .build();
    await repository.insert(entry);

    const result = await useCase.execute({
      id: entry.id,
      status: SimulationStatus.RUNNING,
    });

    expect(result.status).toBe(SimulationStatus.RUNNING);

    const updated = await repository.findById(entry.id);
    expect(updated?.status).toBe(SimulationStatus.RUNNING);
  });

  it('should update status from RUNNING to COMPLETED with summary', async () => {
    const entry = SimulationHistoryEntryFakeBuilder.anEntry()
      .withStatus(SimulationStatus.RUNNING)
      .build();
    await repository.insert(entry);

    const result = await useCase.execute({
      id: entry.id,
      status: SimulationStatus.COMPLETED,
      summaryJson: TEST_SUMMARY_JSON,
    });

    expect(result.status).toBe(SimulationStatus.COMPLETED);
    expect(result.summaryJson).toBe(TEST_SUMMARY_JSON);

    const updated = await repository.findById(entry.id);
    expect(updated?.status).toBe(SimulationStatus.COMPLETED);
    expect(updated?.summaryJson).toBe(TEST_SUMMARY_JSON);
  });

  it('should update status from RUNNING to FAILED with error details', async () => {
    const entry = SimulationHistoryEntryFakeBuilder.anEntry()
      .withStatus(SimulationStatus.RUNNING)
      .build();
    await repository.insert(entry);

    const result = await useCase.execute({
      id: entry.id,
      status: SimulationStatus.FAILED,
      summaryJson: TEST_ERROR_JSON,
    });

    expect(result.status).toBe(SimulationStatus.FAILED);
    expect(result.summaryJson).toBe(TEST_ERROR_JSON);

    const updated = await repository.findById(entry.id);
    expect(updated?.status).toBe(SimulationStatus.FAILED);
    expect(updated?.summaryJson).toBe(TEST_ERROR_JSON);
  });

  it('should update status from RUNNING to CANCELLED', async () => {
    const entry = SimulationHistoryEntryFakeBuilder.anEntry()
      .withStatus(SimulationStatus.RUNNING)
      .build();
    await repository.insert(entry);

    const result = await useCase.execute({
      id: entry.id,
      status: SimulationStatus.CANCELLED,
    });

    expect(result.status).toBe(SimulationStatus.CANCELLED);

    const updated = await repository.findById(entry.id);
    expect(updated?.status).toBe(SimulationStatus.CANCELLED);
  });

  it('should throw NotFoundError when entry does not exist', async () => {
    const nonExistentId = 'non-existent-id';

    await expect(
      useCase.execute({
        id: nonExistentId,
        status: SimulationStatus.RUNNING,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw DomainError for invalid transition from PENDING to COMPLETED', async () => {
    const entry = SimulationHistoryEntryFakeBuilder.anEntry()
      .withStatus(SimulationStatus.PENDING)
      .build();
    await repository.insert(entry);

    await expect(
      useCase.execute({
        id: entry.id,
        status: SimulationStatus.COMPLETED,
      }),
    ).rejects.toThrow(DomainError);
  });

  it('should throw DomainError for invalid transition from COMPLETED to RUNNING', async () => {
    const entry = SimulationHistoryEntryFakeBuilder.anEntry()
      .withStatus(SimulationStatus.COMPLETED)
      .build();
    await repository.insert(entry);

    await expect(
      useCase.execute({
        id: entry.id,
        status: SimulationStatus.RUNNING,
      }),
    ).rejects.toThrow(DomainError);
  });
});
