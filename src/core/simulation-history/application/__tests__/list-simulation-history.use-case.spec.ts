import { ListSimulationHistoryUseCase } from '../use-cases/list-simulation-history.use-case';
import { SimulationHistoryInMemoryRepository } from '../../infra/db/in-memory/simulation-history-in-memory.repository';
import { SimulationHistoryEntryFakeBuilder } from '../../domain/__tests__/simulation-history-entry.fake-builder';
import { SimulationStatus } from '../../domain/value-objects';
import { DomainError } from '@core/shared/domain/errors';

describe('ListSimulationHistoryUseCase', () => {
  let useCase: ListSimulationHistoryUseCase;
  let repository: SimulationHistoryInMemoryRepository;

  beforeEach(() => {
    repository = new SimulationHistoryInMemoryRepository();
    useCase = new ListSimulationHistoryUseCase(repository);
  });

  it('should list entries with default pagination', async () => {
    const entries = SimulationHistoryEntryFakeBuilder.theEntries(3).buildMany(3);
    repository.seed(entries);

    const result = await useCase.execute();

    expect(result.items).toHaveLength(3);
    expect(result.pagination.total).toBe(3);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.perPage).toBe(20);
    expect(result.pagination.lastPage).toBe(1);
  });

  it('should list entries with custom pagination', async () => {
    const entries = SimulationHistoryEntryFakeBuilder.theEntries(25).buildMany(25);
    repository.seed(entries);

    const result = await useCase.execute({
      pagination: { page: 2, perPage: 10 },
    });

    expect(result.items).toHaveLength(10);
    expect(result.pagination.page).toBe(2);
    expect(result.pagination.perPage).toBe(10);
    expect(result.pagination.total).toBe(25);
    expect(result.pagination.lastPage).toBe(3);
  });

  it('should filter by status', async () => {
    const runningEntries = SimulationHistoryEntryFakeBuilder.theEntries(2)
      .withStatus(SimulationStatus.RUNNING)
      .buildMany(2);
    const completedEntries = SimulationHistoryEntryFakeBuilder.theEntries(3)
      .withStatus(SimulationStatus.COMPLETED)
      .buildMany(3);

    repository.seed([...runningEntries, ...completedEntries]);

    const result = await useCase.execute({
      filters: { status: 'RUNNING' },
    });

    expect(result.items).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
    expect(result.items.every((item) => item.status === 'RUNNING')).toBe(true);
  });

  it('should filter by project path', async () => {
    const targetEntries = SimulationHistoryEntryFakeBuilder.theEntries(2)
      .withProjectPath('/test/project')
      .buildMany(2);
    const otherEntries = SimulationHistoryEntryFakeBuilder.theEntries(3)
      .withProjectPath('/other/project')
      .buildMany(3);

    repository.seed([...targetEntries, ...otherEntries]);

    const result = await useCase.execute({
      filters: { projectPath: '/test/project' },
    });

    expect(result.items).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
    expect(result.items.every((item) => item.projectPath.includes('/test/project'))).toBe(true);
  });

  describe('pagination validation', () => {
    test.each([
      {
        page: 0,
        perPage: 20,
        description: 'page is less than 1',
        expectedError: 'Page must be greater than 0',
      },
      {
        page: 1,
        perPage: 0,
        description: 'perPage is less than 1',
        expectedError: 'PerPage must be between 1 and 100',
      },
      {
        page: 1,
        perPage: 101,
        description: 'perPage is greater than 100',
        expectedError: 'PerPage must be between 1 and 100',
      },
    ])('should throw DomainError when $description', async ({ page, perPage, expectedError }) => {
      await expect(useCase.execute({ pagination: { page, perPage } })).rejects.toThrow(
        new DomainError(expectedError),
      );
    });
  });

  it('should calculate last page correctly', async () => {
    const entries = SimulationHistoryEntryFakeBuilder.theEntries(50).buildMany(50);
    repository.seed(entries);

    const result = await useCase.execute({
      pagination: { page: 2, perPage: 20 },
    });

    expect(result.pagination.total).toBe(50);
    expect(result.pagination.page).toBe(2);
    expect(result.pagination.perPage).toBe(20);
    expect(result.pagination.lastPage).toBe(3);
    expect(result.items).toHaveLength(20);
  });
});
