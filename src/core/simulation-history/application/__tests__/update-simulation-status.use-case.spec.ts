import { UpdateSimulationStatusUseCase } from '../use-cases/update-simulation-status.use-case';
import { ISimulationHistoryRepository } from '../../domain/ports';
import { SimulationHistoryEntryFakeBuilder } from '../../domain/__tests__/simulation-history-entry.fake-builder';
import { SimulationStatus } from '../../domain/value-objects';
import { NotFoundError, DomainError } from '@core/shared/domain/errors';

describe('UpdateSimulationStatusUseCase', () => {
  let useCase: UpdateSimulationStatusUseCase;
  let repository: jest.Mocked<ISimulationHistoryRepository>;

  beforeEach(() => {
    repository = {
      insert: jest.fn(),
      findById: jest.fn(),
      search: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };
    useCase = new UpdateSimulationStatusUseCase(repository);
  });

  it('should update status from PENDING to RUNNING', async () => {
    const mockEntry = SimulationHistoryEntryFakeBuilder.anEntry()
      .withStatus(SimulationStatus.PENDING)
      .build();
    repository.findById.mockResolvedValue(mockEntry);
    repository.update.mockResolvedValue();

    const result = await useCase.execute({
      id: mockEntry.id,
      status: SimulationStatus.RUNNING,
    });

    expect(repository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: SimulationStatus.RUNNING,
      }),
    );
    expect(result.status).toBe(SimulationStatus.RUNNING);
  });

  it('should update status from RUNNING to COMPLETED with summary', async () => {
    const mockEntry = SimulationHistoryEntryFakeBuilder.anEntry()
      .withStatus(SimulationStatus.RUNNING)
      .build();
    repository.findById.mockResolvedValue(mockEntry);
    repository.update.mockResolvedValue();

    const summary = JSON.stringify({ result: 'success' });
    const result = await useCase.execute({
      id: mockEntry.id,
      status: SimulationStatus.COMPLETED,
      summaryJson: summary,
    });

    expect(repository.update).toHaveBeenCalled();
    expect(result.status).toBe(SimulationStatus.COMPLETED);
  });

  it('should update status from RUNNING to FAILED with error details', async () => {
    const mockEntry = SimulationHistoryEntryFakeBuilder.anEntry()
      .withStatus(SimulationStatus.RUNNING)
      .build();
    repository.findById.mockResolvedValue(mockEntry);
    repository.update.mockResolvedValue();

    const error = JSON.stringify({ error: 'Something went wrong' });
    const result = await useCase.execute({
      id: mockEntry.id,
      status: SimulationStatus.FAILED,
      summaryJson: error,
    });

    expect(repository.update).toHaveBeenCalled();
    expect(result.status).toBe(SimulationStatus.FAILED);
  });

  it('should update status from RUNNING to CANCELLED', async () => {
    const mockEntry = SimulationHistoryEntryFakeBuilder.anEntry()
      .withStatus(SimulationStatus.RUNNING)
      .build();
    repository.findById.mockResolvedValue(mockEntry);
    repository.update.mockResolvedValue();

    const result = await useCase.execute({
      id: mockEntry.id,
      status: SimulationStatus.CANCELLED,
    });

    expect(repository.update).toHaveBeenCalled();
    expect(result.status).toBe(SimulationStatus.CANCELLED);
  });

  it('should throw NotFoundError when entry does not exist', async () => {
    const nonExistentId = 'non-existent-id';
    repository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        id: nonExistentId,
        status: SimulationStatus.RUNNING,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw DomainError for invalid transition from PENDING to COMPLETED', async () => {
    const mockEntry = SimulationHistoryEntryFakeBuilder.anEntry()
      .withStatus(SimulationStatus.PENDING)
      .build();
    repository.findById.mockResolvedValue(mockEntry);

    await expect(
      useCase.execute({
        id: mockEntry.id,
        status: SimulationStatus.COMPLETED,
      }),
    ).rejects.toThrow(DomainError);
  });

  it('should throw DomainError for invalid transition from COMPLETED to RUNNING', async () => {
    const mockEntry = SimulationHistoryEntryFakeBuilder.anEntry()
      .withStatus(SimulationStatus.COMPLETED)
      .build();
    repository.findById.mockResolvedValue(mockEntry);

    await expect(
      useCase.execute({
        id: mockEntry.id,
        status: SimulationStatus.RUNNING,
      }),
    ).rejects.toThrow(DomainError);
  });
});
