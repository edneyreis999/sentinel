import { DeleteSimulationHistoryUseCase } from '../use-cases/delete-simulation-history.use-case';
import { NotFoundError } from '@core/shared/domain/errors';
import { SimulationHistoryInMemoryRepository } from '../../infra/db/in-memory/simulation-history-in-memory.repository';
import { SimulationHistoryEntryFakeBuilder } from '../../domain/__tests__/simulation-history-entry.fake-builder';

describe('DeleteSimulationHistoryUseCase', () => {
  let useCase: DeleteSimulationHistoryUseCase;
  let repository: SimulationHistoryInMemoryRepository;

  beforeEach(() => {
    repository = new SimulationHistoryInMemoryRepository();
    useCase = new DeleteSimulationHistoryUseCase(repository);
  });

  it('should delete an entry successfully', async () => {
    const entry = SimulationHistoryEntryFakeBuilder.anEntry().withId('test-id').build();

    repository.seed([entry]);

    await expect(useCase.execute({ id: entry.id })).resolves.not.toThrow();

    const exists = await repository.exists(entry.id);
    expect(exists).toBe(false);
  });

  it('should throw NotFoundError when entry does not exist', async () => {
    const nonExistentId = 'non-existent-id';

    await expect(useCase.execute({ id: nonExistentId })).rejects.toThrow(NotFoundError);
  });
});
