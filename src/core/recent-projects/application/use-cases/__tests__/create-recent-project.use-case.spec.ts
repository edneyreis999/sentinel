import { CreateRecentProjectUseCase } from '../create/create-recent-project.use-case';
import type { IRecentProjectsRepository } from '@core/recent-projects/domain/ports/IRecentProjectsRepository';
import { RecentProjectFakeBuilder } from '@core/recent-projects/domain/recent-project.fake-builder';

describe('CreateRecentProjectUseCase', () => {
  let useCase: CreateRecentProjectUseCase;
  let repository: jest.Mocked<IRecentProjectsRepository>;

  beforeEach(() => {
    repository = {
      findByPath: jest.fn(),
      upsert: jest.fn(),
    } as unknown as jest.Mocked<IRecentProjectsRepository>;

    useCase = new CreateRecentProjectUseCase(repository);
  });

  it('should create a new project when path does not exist', async () => {
    repository.findByPath.mockResolvedValue(null);

    const input = {
      path: '/projects/new.sentinel',
      name: 'New Project',
      gameVersion: '1.0.0',
      screenshotPath: '/screenshots/screenshot.png',
      trechoCount: 10,
    };

    const result = await useCase.execute(input);

    expect(repository.findByPath).toHaveBeenCalledWith(input.path);
    expect(repository.upsert).toHaveBeenCalled();
    expect(result.path).toBe(input.path);
    expect(result.name).toBe(input.name);
    expect(result.gameVersion).toBe(input.gameVersion);
  });

  it('should update existing project when path exists', async () => {
    const existingProject = RecentProjectFakeBuilder.aRecentProject()
      .withPath('/projects/existing.sentinel')
      .withName('Existing Project')
      .build();

    repository.findByPath.mockResolvedValue(existingProject);

    const input = {
      path: '/projects/existing.sentinel',
      name: 'Updated Name',
      gameVersion: '2.0.0',
    };

    const result = await useCase.execute(input);

    expect(repository.findByPath).toHaveBeenCalledWith(input.path);
    expect(repository.upsert).toHaveBeenCalled();
    expect(result.name).toBe(input.name);
    expect(result.gameVersion).toBe(input.gameVersion);
  });

  it('should create project with only required fields', async () => {
    repository.findByPath.mockResolvedValue(null);

    const input = {
      path: '/projects/minimal.sentinel',
      name: 'Minimal Project',
    };

    const result = await useCase.execute(input);

    expect(result.path).toBe(input.path);
    expect(result.name).toBe(input.name);
    expect(result.gameVersion).toBeNull();
    expect(result.screenshotPath).toBeNull();
    expect(result.trechoCount).toBeNull();
  });

  it('should handle repository errors', async () => {
    repository.findByPath.mockRejectedValue(new Error('Database error'));

    const input = {
      path: '/projects/test.sentinel',
      name: 'Test Project',
    };

    await expect(useCase.execute(input)).rejects.toThrow('Database error');
  });
});
