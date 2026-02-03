import { ListRecentProjectsUseCase } from '../list/list-recent-projects.use-case';
import type { IRecentProjectsRepository } from '@core/recent-projects/domain/ports/IRecentProjectsRepository';
import { RecentProjectFakeBuilder } from '@core/recent-projects/domain/recent-project.fake-builder';
import { DomainError } from '@core/shared/domain/errors';

// Test constants
const DEFAULT_LIMIT = 10;
const CUSTOM_LIMIT = 15;
const DEFAULT_OFFSET = 0;
const CUSTOM_OFFSET = 15;
const DEFAULT_PAGE = 1;
const CUSTOM_PAGE = 2;
const SMALL_RESULT_COUNT = 5;
const MEDIUM_RESULT_COUNT = 15;
const LARGE_RESULT_COUNT = 25;
const LAST_PAGE_SMALL = 1;
const LAST_PAGE_LARGE = 2;

const TEST_NAME_FILTER = 'Sentinel';
const TEST_GAME_VERSION = '1.0.0';

const MIN_LIMIT = 0;
const MAX_LIMIT = 101;
const NEGATIVE_OFFSET = -1;

const ERROR_MIN_LIMIT = 'Limit must be at least 1';
const ERROR_MAX_LIMIT = 'Limit cannot exceed 100';
const ERROR_NEGATIVE_OFFSET = 'Offset cannot be negative';

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
    const projects = RecentProjectFakeBuilder.aRecentProject().buildMany(SMALL_RESULT_COUNT);

    repository.search.mockResolvedValue({
      items: projects,
      total: SMALL_RESULT_COUNT,
      page: DEFAULT_PAGE,
      perPage: DEFAULT_LIMIT,
      lastPage: LAST_PAGE_SMALL,
    });

    const result = await useCase.execute({});

    expect(repository.search).toHaveBeenCalledWith({
      limit: DEFAULT_LIMIT,
      offset: DEFAULT_OFFSET,
      nameFilter: undefined,
      gameVersion: undefined,
    });
    expect(result.items).toHaveLength(SMALL_RESULT_COUNT);
    expect(result.total).toBe(SMALL_RESULT_COUNT);
  });

  it('should list projects with custom pagination', async () => {
    const projects = RecentProjectFakeBuilder.aRecentProject().buildMany(MEDIUM_RESULT_COUNT);

    repository.search.mockResolvedValue({
      items: projects,
      total: LARGE_RESULT_COUNT,
      page: CUSTOM_PAGE,
      perPage: CUSTOM_LIMIT,
      lastPage: LAST_PAGE_LARGE,
    });

    const result = await useCase.execute({
      limit: CUSTOM_LIMIT,
      offset: CUSTOM_OFFSET,
    });

    expect(repository.search).toHaveBeenCalledWith({
      limit: CUSTOM_LIMIT,
      offset: CUSTOM_OFFSET,
      nameFilter: undefined,
      gameVersion: undefined,
    });
    expect(result.page).toBe(CUSTOM_PAGE);
    expect(result.perPage).toBe(CUSTOM_LIMIT);
  });

  it('should filter by name', async () => {
    repository.search.mockResolvedValue({
      items: [],
      total: 0,
      page: DEFAULT_PAGE,
      perPage: DEFAULT_LIMIT,
      lastPage: LAST_PAGE_SMALL,
    });

    await useCase.execute({
      nameFilter: TEST_NAME_FILTER,
    });

    expect(repository.search).toHaveBeenCalledWith({
      limit: DEFAULT_LIMIT,
      offset: DEFAULT_OFFSET,
      nameFilter: TEST_NAME_FILTER,
      gameVersion: undefined,
    });
  });

  it('should filter by game version', async () => {
    repository.search.mockResolvedValue({
      items: [],
      total: 0,
      page: DEFAULT_PAGE,
      perPage: DEFAULT_LIMIT,
      lastPage: LAST_PAGE_SMALL,
    });

    await useCase.execute({
      gameVersion: TEST_GAME_VERSION,
    });

    expect(repository.search).toHaveBeenCalledWith({
      limit: DEFAULT_LIMIT,
      offset: DEFAULT_OFFSET,
      nameFilter: undefined,
      gameVersion: TEST_GAME_VERSION,
    });
  });

  it('should throw DomainError for invalid limit', async () => {
    await expect(useCase.execute({ limit: MIN_LIMIT })).rejects.toThrow(DomainError);
    await expect(useCase.execute({ limit: MIN_LIMIT })).rejects.toThrow(ERROR_MIN_LIMIT);
  });

  it('should throw DomainError for limit exceeding max', async () => {
    await expect(useCase.execute({ limit: MAX_LIMIT })).rejects.toThrow(DomainError);
    await expect(useCase.execute({ limit: MAX_LIMIT })).rejects.toThrow(ERROR_MAX_LIMIT);
  });

  it('should throw DomainError for negative offset', async () => {
    await expect(useCase.execute({ offset: NEGATIVE_OFFSET })).rejects.toThrow(DomainError);
    await expect(useCase.execute({ offset: NEGATIVE_OFFSET })).rejects.toThrow(
      ERROR_NEGATIVE_OFFSET,
    );
  });
});
