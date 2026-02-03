import { ListRecentProjectsUseCase } from '../list/list-recent-projects.use-case';
import type { IRecentProjectsRepository } from '@core/recent-projects/domain/ports/IRecentProjectsRepository';
import { RecentProjectFakeBuilder } from '@core/recent-projects/domain/recent-project.fake-builder';
import { DomainError } from '@core/shared/domain/errors';

describe('ListRecentProjectsUseCase', () => {
  let useCase: ListRecentProjectsUseCase;
  let repository: jest.Mocked<IRecentProjectsRepository>;

  beforeEach(() => {
    repository = {
      search: jest.fn(),
    } as unknown as jest.Mocked<IRecentProjectsRepository>;

    useCase = new ListRecentProjectsUseCase(repository);
  });

  it('should list projects with default pagination', async () => {
    const projects = RecentProjectFakeBuilder.aRecentProject().buildMany(5);

    repository.search.mockResolvedValue({
      items: projects,
      total: 5,
      page: 1,
      perPage: 10,
      lastPage: 1,
    });

    const result = await useCase.execute({});

    expect(repository.search).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      nameFilter: undefined,
      gameVersion: undefined,
    });
    expect(result.items).toHaveLength(5);
    expect(result.total).toBe(5);
  });

  it('should list projects with custom pagination', async () => {
    const projects = RecentProjectFakeBuilder.aRecentProject().buildMany(15);

    repository.search.mockResolvedValue({
      items: projects,
      total: 25,
      page: 2,
      perPage: 15,
      lastPage: 2,
    });

    const result = await useCase.execute({
      limit: 15,
      offset: 15,
    });

    expect(repository.search).toHaveBeenCalledWith({
      limit: 15,
      offset: 15,
      nameFilter: undefined,
      gameVersion: undefined,
    });
    expect(result.page).toBe(2);
    expect(result.perPage).toBe(15);
  });

  it('should filter by name', async () => {
    repository.search.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 10,
      lastPage: 1,
    });

    await useCase.execute({
      nameFilter: 'Sentinel',
    });

    expect(repository.search).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      nameFilter: 'Sentinel',
      gameVersion: undefined,
    });
  });

  it('should filter by game version', async () => {
    repository.search.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 10,
      lastPage: 1,
    });

    await useCase.execute({
      gameVersion: '1.0.0',
    });

    expect(repository.search).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      nameFilter: undefined,
      gameVersion: '1.0.0',
    });
  });

  it('should throw DomainError for invalid limit', async () => {
    await expect(useCase.execute({ limit: 0 })).rejects.toThrow(DomainError);
    await expect(useCase.execute({ limit: 0 })).rejects.toThrow('Limit must be at least 1');
  });

  it('should throw DomainError for limit exceeding max', async () => {
    await expect(useCase.execute({ limit: 101 })).rejects.toThrow(DomainError);
    await expect(useCase.execute({ limit: 101 })).rejects.toThrow('Limit cannot exceed 100');
  });

  it('should throw DomainError for negative offset', async () => {
    await expect(useCase.execute({ offset: -1 })).rejects.toThrow(DomainError);
    await expect(useCase.execute({ offset: -1 })).rejects.toThrow('Offset cannot be negative');
  });
});
