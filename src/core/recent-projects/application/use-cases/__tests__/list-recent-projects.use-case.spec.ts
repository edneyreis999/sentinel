import { ListRecentProjectsUseCase } from '../list/list-recent-projects.use-case';
import { RecentProjectsInMemoryRepository } from '@core/recent-projects/infra/db/in-memory/recent-projects-in-memory.repository';
import { RecentProjectFakeBuilder } from '@core/recent-projects/domain/recent-project.fake-builder';
import { DomainError } from '@core/shared/domain/errors';
import { ListRecentProjectsInputFakeBuilder } from './_fakes';

// Test constants
const DEFAULT_LIMIT = 10;
const CUSTOM_LIMIT = 15;
const CUSTOM_OFFSET = 15;
const DEFAULT_PAGE = 1;
const CUSTOM_PAGE = 2;
const SMALL_RESULT_COUNT = 5;
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
  let repository: RecentProjectsInMemoryRepository;

  beforeEach(() => {
    repository = new RecentProjectsInMemoryRepository();
    useCase = new ListRecentProjectsUseCase(repository);
  });

  it('should list projects with default pagination', async () => {
    // Arrange: Populate repository with test data
    const projects = RecentProjectFakeBuilder.aRecentProject().buildMany(SMALL_RESULT_COUNT);
    for (const project of projects) {
      await repository.upsert(project);
    }

    // Act
    const result = await useCase.execute(ListRecentProjectsInputFakeBuilder.createEmpty().build());

    // Assert
    expect(result.items).toHaveLength(SMALL_RESULT_COUNT);
    expect(result.total).toBe(SMALL_RESULT_COUNT);
    expect(result.page).toBe(DEFAULT_PAGE);
    expect(result.perPage).toBe(DEFAULT_LIMIT);
    expect(result.lastPage).toBe(LAST_PAGE_SMALL);
  });

  it('should list projects with custom pagination', async () => {
    // Arrange: Create 25 projects to test pagination
    const projects = RecentProjectFakeBuilder.aRecentProject().buildMany(LARGE_RESULT_COUNT);
    for (const project of projects) {
      await repository.upsert(project);
    }

    // Act: Request second page with custom limit
    const result = await useCase.execute(
      ListRecentProjectsInputFakeBuilder.create()
        .withLimit(CUSTOM_LIMIT)
        .withOffset(CUSTOM_OFFSET)
        .build(),
    );

    // Assert
    expect(result.total).toBe(LARGE_RESULT_COUNT);
    expect(result.page).toBe(CUSTOM_PAGE);
    expect(result.perPage).toBe(CUSTOM_LIMIT);
    expect(result.lastPage).toBe(LAST_PAGE_LARGE);
    expect(result.items).toHaveLength(CUSTOM_LIMIT - SMALL_RESULT_COUNT); // 10 items on second page
  });

  it('should filter by name', async () => {
    // Arrange: Create 4 projects - 2 matching filter, 2 not matching
    const projects = RecentProjectFakeBuilder.aRecentProject()
      .withPath((index) => `/projects/project-${index}.sentinel`)
      .withName((index) => (index < 2 ? `Sentinel Project ${index + 1}` : `Other ${index + 1}`))
      .buildMany(4);

    for (const project of projects) {
      await repository.upsert(project);
    }

    // Act
    const result = await useCase.execute(
      ListRecentProjectsInputFakeBuilder.create().withNameFilter(TEST_NAME_FILTER).build(),
    );

    // Assert: Only Sentinel projects should be returned
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.items.every((p) => p.name.includes(TEST_NAME_FILTER))).toBe(true);
  });

  it('should filter by game version', async () => {
    // Arrange: Create 3 projects - 2 with v1.0.0, 1 with v2.0.0
    const projects = RecentProjectFakeBuilder.aRecentProject()
      .withPath((index) => `/projects/v${index}-proj.sentinel`)
      .withGameVersion((index) => (index < 2 ? TEST_GAME_VERSION : '2.0.0'))
      .buildMany(3);

    for (const project of projects) {
      await repository.upsert(project);
    }

    // Act
    const result = await useCase.execute(
      ListRecentProjectsInputFakeBuilder.create().withGameVersion(TEST_GAME_VERSION).build(),
    );

    // Assert: Only v1.0.0 projects should be returned
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.items.every((p) => p.gameVersion === TEST_GAME_VERSION)).toBe(true);
  });

  it('should throw DomainError for invalid limit', async () => {
    const input = ListRecentProjectsInputFakeBuilder.createWithInvalidLimit(MIN_LIMIT).build();
    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
    await expect(useCase.execute(input)).rejects.toThrow(ERROR_MIN_LIMIT);
  });

  it('should throw DomainError for limit exceeding max', async () => {
    const input = ListRecentProjectsInputFakeBuilder.createWithInvalidLimit(MAX_LIMIT).build();
    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
    await expect(useCase.execute(input)).rejects.toThrow(ERROR_MAX_LIMIT);
  });

  it('should throw DomainError for negative offset', async () => {
    const input =
      ListRecentProjectsInputFakeBuilder.createWithInvalidOffset(NEGATIVE_OFFSET).build();
    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
    await expect(useCase.execute(input)).rejects.toThrow(ERROR_NEGATIVE_OFFSET);
  });
});
