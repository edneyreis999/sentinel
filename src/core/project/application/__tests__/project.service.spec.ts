/**
 * ProjectService - Integration Tests
 *
 * STRATEGY: Application Service Testing
 *
 * Tests the service orchestration logic with real use cases and fake repository.
 * ONLY tests methods with actual orchestration logic (not pure delegation).
 *
 * RATIONALE:
 * - createProject and getProject are pure delegation (no logic to test)
 * - getOrCreate has orchestration logic (try-catch, conditional flow) that should be tested
 *
 * CHECKLIST:
 * - [x] Unit under test: ProjectService (orchestration layer)
 * - [x] Expected behavior: Coordinates use cases correctly
 * - [x] Bug localization: Fails when coordination logic changes
 * - [x] Uses REAL use cases with FAKE repository (integration test)
 */

import { ProjectService } from '../services/project.service';
import { CreateProjectUseCase, GetProjectUseCase } from '../use-cases';
import { ProjectRepositoryFake } from './_fakes/project.repository.fake';
import { CreateProjectInputFakeBuilder, CreateProjectOutputFakeBuilder } from './_fakes';

describe('ProjectService', () => {
  let service: ProjectService;
  let repository: ProjectRepositoryFake;
  let createProjectUseCase: CreateProjectUseCase;
  let getProjectUseCase: GetProjectUseCase;

  beforeEach(() => {
    repository = new ProjectRepositoryFake();
    createProjectUseCase = new CreateProjectUseCase(repository);
    getProjectUseCase = new GetProjectUseCase(repository);
    service = new ProjectService(createProjectUseCase, getProjectUseCase);
  });

  describe('getOrCreate - orchestration logic', () => {
    it('should return existing project when found', async () => {
      // Arrange: Create and store a project in the repository
      // NOTE: ID must match path because getOrCreate uses path as ID for lookup
      const existingProject = CreateProjectOutputFakeBuilder.create()
        .withId('/existing/path')
        .withPath('/existing/path')
        .withName('Existing Project')
        .build();

      repository.seed([existingProject]);

      const input = CreateProjectInputFakeBuilder.create().withPath('/existing/path').build();

      // Act
      const result = await service.getOrCreate(input);

      // Assert: Should return existing project without creating new one
      expect(result.project.path).toBe('/existing/path');
      expect(result.project.name).toBe('Existing Project');
      expect(result.created).toBe(false);

      // Verify only one project exists in repository
      const allProjects = repository.getAll();
      expect(allProjects).toHaveLength(1);
    });

    it('should create new project when not found', async () => {
      // Arrange: Repository is empty (project doesn't exist)
      const input = CreateProjectInputFakeBuilder.create()
        .withPath('/new/path')
        .withName('New Project')
        .build();

      // Act
      const result = await service.getOrCreate(input);

      // Assert: Should create and return new project
      expect(result.project.path).toBe('/new/path');
      expect(result.project.name).toBe('New Project');
      expect(result.created).toBe(true);

      // Verify project was persisted to repository
      const stored = await repository.findById(result.project.id);
      expect(stored).toBeDefined();
      expect(stored?.path).toBe('/new/path');
    });

    it('should use path as ID for getProject lookup', async () => {
      // Arrange: Create project with specific path as ID
      const project = CreateProjectOutputFakeBuilder.create()
        .withId('/specific/path')
        .withPath('/specific/path')
        .build();

      repository.seed([project]);

      const input = CreateProjectInputFakeBuilder.create().withPath('/specific/path').build();

      // Act
      const result = await service.getOrCreate(input);

      // Assert: Should find project using path as ID
      expect(result.project.path).toBe('/specific/path');
      expect(result.created).toBe(false);
    });

    it('should create multiple projects with different paths', async () => {
      // Arrange
      const input1 = CreateProjectInputFakeBuilder.create()
        .withPath('/path1')
        .withName('First Project')
        .build();

      const input2 = CreateProjectInputFakeBuilder.create()
        .withPath('/path2')
        .withName('Second Project')
        .build();

      // Act: Create first project
      const result1 = await service.getOrCreate(input1);
      expect(result1.created).toBe(true);
      expect(result1.project.name).toBe('First Project');

      // Create second project with different path
      const result2 = await service.getOrCreate(input2);
      expect(result2.created).toBe(true);
      expect(result2.project.name).toBe('Second Project');

      // Assert: Verify two distinct projects in repository
      const allProjects = repository.getAll();
      expect(allProjects).toHaveLength(2);
      expect(allProjects[0].path).not.toBe(allProjects[1].path);
    });
  });
});
