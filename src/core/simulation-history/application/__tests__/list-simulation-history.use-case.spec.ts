import { ListSimulationHistoryUseCase } from '../use-cases/list-simulation-history.use-case';
import { ISimulationHistoryRepository } from '../../domain/ports';
import { SimulationHistoryEntryFakeBuilder } from '../../domain/__tests__/simulation-history-entry.fake-builder';
import { SimulationStatus } from '../../domain/value-objects';
import { DomainError } from '@core/shared/domain/errors';

describe('ListSimulationHistoryUseCase', () => {
  let useCase: ListSimulationHistoryUseCase;
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
    useCase = new ListSimulationHistoryUseCase(repository);
  });

  it('should list entries with default pagination', async () => {
    const mockEntries = SimulationHistoryEntryFakeBuilder.theEntries(3).buildMany(3);
    repository.search.mockResolvedValue({
      items: mockEntries,
      filters: {},
      pagination: { total: 3, page: 1, perPage: 20, lastPage: 1 },
    });

    const result = await useCase.execute();

    expect(repository.search).toHaveBeenCalledWith({}, { page: 1, perPage: 20 });
    expect(result.items).toHaveLength(3);
    expect(result.pagination.total).toBe(3);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.perPage).toBe(20);
  });

  it('should list entries with custom pagination', async () => {
    const mockEntries = SimulationHistoryEntryFakeBuilder.theEntries(5).buildMany(5);
    repository.search.mockResolvedValue({
      items: mockEntries,
      filters: {},
      pagination: { total: 5, page: 2, perPage: 10, lastPage: 1 },
    });

    const result = await useCase.execute({
      pagination: { page: 2, perPage: 10 },
    });

    expect(repository.search).toHaveBeenCalledWith({}, { page: 2, perPage: 10 });
    expect(result.pagination.page).toBe(2);
    expect(result.pagination.perPage).toBe(10);
  });

  it('should filter by status', async () => {
    const mockEntries = SimulationHistoryEntryFakeBuilder.theEntries(2)
      .withStatus(SimulationStatus.RUNNING)
      .buildMany(2);

    repository.search.mockResolvedValue({
      items: mockEntries,
      filters: { status: 'RUNNING' },
      pagination: { total: 2, page: 1, perPage: 20, lastPage: 1 },
    });

    const result = await useCase.execute({
      filters: { status: 'RUNNING' },
    });

    expect(repository.search).toHaveBeenCalledWith({ status: 'RUNNING' }, { page: 1, perPage: 20 });
    expect(result.items).toHaveLength(2);
  });

  it('should filter by project path', async () => {
    const mockEntries = SimulationHistoryEntryFakeBuilder.theEntries(1).buildMany(1);

    repository.search.mockResolvedValue({
      items: mockEntries,
      filters: { projectPath: '/test/project' },
      pagination: { total: 1, page: 1, perPage: 20, lastPage: 1 },
    });

    await useCase.execute({
      filters: { projectPath: '/test/project' },
    });

    expect(repository.search).toHaveBeenCalledWith(
      { projectPath: '/test/project' },
      { page: 1, perPage: 20 },
    );
  });

  it('should throw error when page is less than 1', async () => {
    await expect(useCase.execute({ pagination: { page: 0, perPage: 20 } })).rejects.toThrow(
      DomainError,
    );
  });

  it('should throw error when perPage is less than 1', async () => {
    await expect(useCase.execute({ pagination: { page: 1, perPage: 0 } })).rejects.toThrow(
      DomainError,
    );
  });

  it('should throw error when perPage is greater than 100', async () => {
    await expect(useCase.execute({ pagination: { page: 1, perPage: 101 } })).rejects.toThrow(
      DomainError,
    );
  });

  it('should calculate last page correctly', async () => {
    const mockEntries = SimulationHistoryEntryFakeBuilder.theEntries(20).buildMany(20);
    repository.search.mockResolvedValue({
      items: mockEntries,
      filters: {},
      pagination: { total: 50, page: 2, perPage: 20, lastPage: 3 },
    });

    await useCase.execute({
      pagination: { page: 2, perPage: 20 },
    });

    expect(repository.search).toHaveBeenCalled();
  });
});
