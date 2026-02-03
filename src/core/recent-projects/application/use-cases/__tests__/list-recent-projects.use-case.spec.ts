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
    // Arrange: Create projects with different names and unique paths
    const sentinelProjects = [
      RecentProjectFakeBuilder.aRecentProject()
        .withPath('/projects/sentinel1.sentinel')
        .withName('Sentinel Project 1')
        .build(),
      RecentProjectFakeBuilder.aRecentProject()
        .withPath('/projects/sentinel2.sentinel')
        .withName('Sentinel Project 2')
        .build(),
    ];
    const otherProjects = [
      RecentProjectFakeBuilder.aRecentProject()
        .withPath('/projects/other.sentinel')
        .withName('Other Project')
        .build(),
      RecentProjectFakeBuilder.aRecentProject()
        .withPath('/projects/different.sentinel')
        .withName('Different Name')
        .build(),
    ];

    for (const project of [...sentinelProjects, ...otherProjects]) {
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
    // Arrange: Create projects with different versions and unique paths
    const v1Projects = [
      RecentProjectFakeBuilder.aRecentProject()
        .withPath('/projects/v1-proj1.sentinel')
        .withGameVersion(TEST_GAME_VERSION)
        .build(),
      RecentProjectFakeBuilder.aRecentProject()
        .withPath('/projects/v1-proj2.sentinel')
        .withGameVersion(TEST_GAME_VERSION)
        .build(),
    ];
    const v2Projects = [
      RecentProjectFakeBuilder.aRecentProject()
        .withPath('/projects/v2-proj.sentinel')
        .withGameVersion('2.0.0')
        .build(),
    ];

    for (const project of [...v1Projects, ...v2Projects]) {
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
