import { GetSimulationHistoryUseCase } from '../use-cases/get-simulation-history.use-case';
import { ISimulationHistoryRepository } from '../../domain/ports';
import { SimulationHistoryEntryFakeBuilder } from '../../domain/__tests__/simulation-history-entry.fake-builder';
import { NotFoundError } from '@core/shared/domain/errors';

describe('GetSimulationHistoryUseCase', () => {
  let useCase: GetSimulationHistoryUseCase;
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
    useCase = new GetSimulationHistoryUseCase(repository);
  });

  it('should get an entry by ID successfully', async () => {
    const mockEntry = SimulationHistoryEntryFakeBuilder.anEntry().build();
    repository.findById.mockResolvedValue(mockEntry);

    const result = await useCase.execute({ id: mockEntry.id });

    expect(repository.findById).toHaveBeenCalledWith(mockEntry.id);
    expect(result).toBeDefined();
    expect(result.id).toBe(mockEntry.id);
  });

  it('should throw NotFoundError when entry does not exist', async () => {
    const nonExistentId = 'non-existent-id';
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ id: nonExistentId })).rejects.toThrow(NotFoundError);
  });
});
