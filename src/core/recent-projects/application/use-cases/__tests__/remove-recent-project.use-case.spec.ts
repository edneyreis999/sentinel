import { RemoveRecentProjectUseCase } from '../remove/remove-recent-project.use-case';
import { RecentProjectsInMemoryRepository } from '@core/recent-projects/infra/db/in-memory/recent-projects-in-memory.repository';
import { RecentProjectFakeBuilder } from '@core/recent-projects/domain/recent-project.fake-builder';
import { DomainError } from '@core/shared/domain/errors';

// Test constants
const TEST_REMOVE_PROJECT_PATH = '/projects/to-remove.sentinel';
const TEST_NONEXISTENT_PROJECT_PATH = '/projects/nonexistent.sentinel';
const TEST_EMPTY_PATH = '';
const TEST_WHITESPACE_PATH = '   ';
const ERROR_NOT_FOUND = 'not found';
const ERROR_PATH_REQUIRED = 'Project path is required';

describe('RemoveRecentProjectUseCase', () => {
  let useCase: RemoveRecentProjectUseCase;
  let repository: RecentProjectsInMemoryRepository;

  beforeEach(() => {
    repository = new RecentProjectsInMemoryRepository();
    useCase = new RemoveRecentProjectUseCase(repository);
  });

  it('should remove existing project', async () => {
    // Arrange: Create a project in the repository
    const project = RecentProjectFakeBuilder.aRecentProject()
      .withPath(TEST_REMOVE_PROJECT_PATH)
      .build();
    await repository.upsert(project);

    const input = {
      path: TEST_REMOVE_PROJECT_PATH,
    };

    // Act
    await useCase.execute(input);

    // Assert: Verify project was removed
    const exists = await repository.existsByPath(input.path);
    expect(exists).toBe(false);
  });

  it('should throw DomainError when project not found', async () => {
    // Repository is empty, so project doesn't exist
    const input = {
      path: TEST_NONEXISTENT_PROJECT_PATH,
    };

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
    await expect(useCase.execute(input)).rejects.toThrow(ERROR_NOT_FOUND);
  });

  it('should throw DomainError for empty path', async () => {
    const input = {
      path: TEST_EMPTY_PATH,
    };

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
    await expect(useCase.execute(input)).rejects.toThrow(ERROR_PATH_REQUIRED);
  });

  it('should throw DomainError for whitespace-only path', async () => {
    const input = {
      path: TEST_WHITESPACE_PATH,
    };

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
  });
});
