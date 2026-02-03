import { RemoveRecentProjectUseCase } from '../remove/remove-recent-project.use-case';
import type { IRecentProjectsRepository } from '@core/recent-projects/domain/ports/IRecentProjectsRepository';
import { DomainError } from '@core/shared/domain/errors';

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
      path: '/projects/to-remove.sentinel',
    };

    await useCase.execute(input);

    expect(repository.existsByPath).toHaveBeenCalledWith(input.path);
    expect(repository.delete).toHaveBeenCalledWith(input.path);
  });

  it('should throw DomainError when project not found', async () => {
    repository.existsByPath.mockResolvedValue(false);

    const input = {
      path: '/projects/nonexistent.sentinel',
    };

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
    await expect(useCase.execute(input)).rejects.toThrow('not found');
  });

  it('should throw DomainError for empty path', async () => {
    const input = {
      path: '',
    };

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
    await expect(useCase.execute(input)).rejects.toThrow('Project path is required');
  });

  it('should throw DomainError for whitespace-only path', async () => {
    const input = {
      path: '   ',
    };

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
  });
});
