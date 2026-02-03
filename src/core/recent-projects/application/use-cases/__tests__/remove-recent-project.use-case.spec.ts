import { RemoveRecentProjectUseCase } from '../remove/remove-recent-project.use-case';
import type { IRecentProjectsRepository } from '@core/recent-projects/domain/ports/IRecentProjectsRepository';
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
  let repository: jest.Mocked<IRecentProjectsRepository>;

  beforeEach(() => {
    repository = {
      existsByPath: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IRecentProjectsRepository>;

    useCase = new RemoveRecentProjectUseCase(repository);
  });

  it('should remove existing project', async () => {
    repository.existsByPath.mockResolvedValue(true);

    const input = {
      path: TEST_REMOVE_PROJECT_PATH,
    };

    await useCase.execute(input);

    expect(repository.existsByPath).toHaveBeenCalledWith(input.path);
    expect(repository.delete).toHaveBeenCalledWith(input.path);
  });

  it('should throw DomainError when project not found', async () => {
    repository.existsByPath.mockResolvedValue(false);

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
