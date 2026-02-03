import { CreateRecentProjectUseCase } from '../create/create-recent-project.use-case';
import { RecentProjectsInMemoryRepository } from '@core/recent-projects/infra/db/in-memory/recent-projects-in-memory.repository';
import { RecentProjectFakeBuilder } from '@core/recent-projects/domain/recent-project.fake-builder';
import { CreateRecentProjectInputFakeBuilder } from './_fakes';

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

describe('CreateRecentProjectUseCase', () => {
  let useCase: CreateRecentProjectUseCase;
  let repository: RecentProjectsInMemoryRepository;

  beforeEach(() => {
    repository = new RecentProjectsInMemoryRepository();
    useCase = new CreateRecentProjectUseCase(repository);
  });

  it('should create a new project when path does not exist', async () => {
    const input = CreateRecentProjectInputFakeBuilder.create()
      .withPath(TEST_NEW_PROJECT_PATH)
      .withName(TEST_NEW_PROJECT_NAME)
      .withGameVersion(TEST_NEW_PROJECT_VERSION)
      .withScreenshotPath(TEST_SCREENSHOT_PATH)
      .withTrechoCount(TEST_TRECHO_COUNT)
      .build();

    const result = await useCase.execute(input);

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

    // Pre-populate repository with existing project
    await repository.upsert(existingProject);

    const input = CreateRecentProjectInputFakeBuilder.create()
      .withPath(TEST_EXISTING_PROJECT_PATH)
      .withName(TEST_UPDATED_PROJECT_NAME)
      .withGameVersion(TEST_UPDATED_PROJECT_VERSION)
      .build();

    const result = await useCase.execute(input);

    expect(result.name).toBe(input.name);
    expect(result.gameVersion).toBe(input.gameVersion);
  });

  it('should create project with only required fields', async () => {
    const input = CreateRecentProjectInputFakeBuilder.createMinimal()
      .withPath(TEST_MINIMAL_PROJECT_PATH)
      .withName(TEST_MINIMAL_PROJECT_NAME)
      .build();

    const result = await useCase.execute(input);

    expect(result.path).toBe(input.path);
    expect(result.name).toBe(input.name);
    expect(result.gameVersion).toBeNull();
    expect(result.screenshotPath).toBeNull();
    expect(result.trechoCount).toBeNull();
  });
});
