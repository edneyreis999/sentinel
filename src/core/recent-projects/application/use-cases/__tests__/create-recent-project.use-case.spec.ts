import { CreateRecentProjectUseCase } from '../create/create-recent-project.use-case';
import type { IRecentProjectsRepository } from '@core/recent-projects/domain/ports/IRecentProjectsRepository';
import { RecentProjectFakeBuilder } from '@core/recent-projects/domain/recent-project.fake-builder';

// Test constants
const TEST_NEW_PROJECT_PATH = '/projects/new.sentinel';
const TEST_NEW_PROJECT_NAME = 'New Project';
const TEST_NEW_PROJECT_VERSION = '1.0.0';
const TEST_SCREENSHOT_PATH = '/screenshots/screenshot.png';
const TEST_TRECHO_COUNT = 10;

const TEST_EXISTING_PROJECT_PATH = '/projects/existing.sentinel';
const TEST_EXISTING_PROJECT_NAME = 'Existing Project';
const TEST_UPDATED_PROJECT_NAME = 'Updated Name';
const TEST_UPDATED_PROJECT_VERSION = '2.0.0';

const TEST_MINIMAL_PROJECT_PATH = '/projects/minimal.sentinel';
const TEST_MINIMAL_PROJECT_NAME = 'Minimal Project';

const TEST_ERROR_PROJECT_PATH = '/projects/test.sentinel';
const TEST_ERROR_PROJECT_NAME = 'Test Project';
const TEST_DATABASE_ERROR_MESSAGE = 'Database error';

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
      path: TEST_NEW_PROJECT_PATH,
      name: TEST_NEW_PROJECT_NAME,
      gameVersion: TEST_NEW_PROJECT_VERSION,
      screenshotPath: TEST_SCREENSHOT_PATH,
      trechoCount: TEST_TRECHO_COUNT,
    };

    const result = await useCase.execute(input);

    expect(repository.findByPath).toHaveBeenCalledWith(input.path);
    expect(repository.upsert).toHaveBeenCalled();
    expect(result).toMatchObject({
      path: input.path,
      name: input.name,
      gameVersion: input.gameVersion,
      screenshotPath: input.screenshotPath,
      trechoCount: input.trechoCount,
    });
  });

  it('should update existing project when path exists', async () => {
    const existingProject = RecentProjectFakeBuilder.aRecentProject()
      .withPath(TEST_EXISTING_PROJECT_PATH)
      .withName(TEST_EXISTING_PROJECT_NAME)
      .build();

    repository.findByPath.mockResolvedValue(existingProject);

    const input = {
      path: TEST_EXISTING_PROJECT_PATH,
      name: TEST_UPDATED_PROJECT_NAME,
      gameVersion: TEST_UPDATED_PROJECT_VERSION,
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
      path: TEST_MINIMAL_PROJECT_PATH,
      name: TEST_MINIMAL_PROJECT_NAME,
    };

    const result = await useCase.execute(input);

    expect(result.path).toBe(input.path);
    expect(result.name).toBe(input.name);
    expect(result.gameVersion).toBeNull();
    expect(result.screenshotPath).toBeNull();
    expect(result.trechoCount).toBeNull();
  });

  it('should handle repository errors', async () => {
    repository.findByPath.mockRejectedValue(new Error(TEST_DATABASE_ERROR_MESSAGE));

    const input = {
      path: TEST_ERROR_PROJECT_PATH,
      name: TEST_ERROR_PROJECT_NAME,
    };

    await expect(useCase.execute(input)).rejects.toThrow(TEST_DATABASE_ERROR_MESSAGE);
  });
});
