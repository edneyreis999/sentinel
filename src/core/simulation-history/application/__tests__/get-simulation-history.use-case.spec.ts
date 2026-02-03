import { GetSimulationHistoryUseCase } from '../use-cases/get-simulation-history.use-case';
import { SimulationHistoryInMemoryRepository } from '../../infra/db/in-memory/simulation-history-in-memory.repository';
import { SimulationHistoryEntryFakeBuilder } from '../../domain/__tests__/simulation-history-entry.fake-builder';
import { NotFoundError } from '@core/shared/domain/errors';

describe('GetSimulationHistoryUseCase', () => {
  let useCase: GetSimulationHistoryUseCase;
  let repository: SimulationHistoryInMemoryRepository;

  beforeEach(() => {
    repository = new SimulationHistoryInMemoryRepository();
    useCase = new GetSimulationHistoryUseCase(repository);
  });

  it('should get an entry by ID successfully', async () => {
    const entry = SimulationHistoryEntryFakeBuilder.anEntry().build();
    repository.seed([entry]);

    const result = await useCase.execute({ id: entry.id });

    expect(result).toBeDefined();
    expect(result.id).toBe(entry.id);
    expect(result.projectPath).toBe(entry.projectPath);
    expect(result.projectName).toBe(entry.projectName);
  });

  it('should throw NotFoundError when entry does not exist', async () => {
    const nonExistentId = 'non-existent-id';

    await expect(useCase.execute({ id: nonExistentId })).rejects.toThrow(NotFoundError);
  });
});
