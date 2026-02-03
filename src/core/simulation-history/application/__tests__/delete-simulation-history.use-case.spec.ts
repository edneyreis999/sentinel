import { DeleteSimulationHistoryUseCase } from '../use-cases/delete-simulation-history.use-case';
import { ISimulationHistoryRepository } from '../../domain/ports';
import { NotFoundError } from '@core/shared/domain/errors';

describe('DeleteSimulationHistoryUseCase', () => {
  let useCase: DeleteSimulationHistoryUseCase;
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
    useCase = new DeleteSimulationHistoryUseCase(repository);
  });

  it('should delete an entry successfully', async () => {
    const entryId = 'test-id';
    repository.exists.mockResolvedValue(true);
    repository.delete.mockResolvedValue();

    await expect(useCase.execute({ id: entryId })).resolves.not.toThrow();

    expect(repository.exists).toHaveBeenCalledWith(entryId);
    expect(repository.delete).toHaveBeenCalledWith(entryId);
  });

  it('should throw NotFoundError when entry does not exist', async () => {
    const nonExistentId = 'non-existent-id';
    repository.exists.mockResolvedValue(false);

    await expect(useCase.execute({ id: nonExistentId })).rejects.toThrow(NotFoundError);
  });
});
