/**
 * CreateProjectUseCase - Integration Tests
 *
 * STRATEGY: Application Layer Integration Testing
 *
 * These tests validate the INTEGRATION between:
 * - Application Layer (Use Case)
 * - Fake Repository (simulating Infrastructure)
 *
 * This is NOT a full stack test - no database, no framework.
 * It validates that the Use Case integrates correctly with the repository port.
 *
 * DIFFERENCE FROM UNIT TESTS:
 * - Unit tests use mocked repository (verify calls)
 * - Integration tests use fake repository (real behavior)
 *
 * CHECKLIST:
 * - [x] What's being tested? Integration between use case and repository
 * - [x] Expected behavior? Full workflow works end-to-end
 * - [x] How to find bugs? Fails when interface contract breaks
 * - [x] Validates business rules? Yes, in integration context
 */

import { CreateProjectUseCase } from '../use-cases/create-project.use-case';
import {
  ProjectRepositoryFake,
  CreateProjectInputFakeBuilder,
  CreateProjectOutputFakeBuilder,
} from './_fakes';
import { DomainError } from '@core/shared/domain/errors';

describe('CreateProjectUseCase - Integration', () => {
  let useCase: CreateProjectUseCase;
  let repository: ProjectRepositoryFake;

  beforeEach(() => {
    // Use REAL fake repository (not mocked)
    repository = new ProjectRepositoryFake();
    useCase = new CreateProjectUseCase(repository);
  });

  describe('create project workflow', () => {
    it('should complete full create workflow', async () => {
      // Arrange
      const input = CreateProjectInputFakeBuilder.create()
        .withName('Integration Test Project')
        .withPath('/integration/test')
        .build();

      // Act
      const result = await useCase.execute(input);

      // Assert - Verify project was actually stored
      const stored = await repository.findById(result.id);
      expect(stored).toBeDefined();
      expect(stored?.id).toBe(result.id);
      expect(stored?.name).toBe('Integration Test Project');
    });

    it('should persist project across multiple operations', async () => {
      // Arrange & Act - Create first project
      const input1 = CreateProjectInputFakeBuilder.create()
        .withName('First Project')
        .withPath('/first')
        .build();
      const project1 = await useCase.execute(input1);

      // Act - Create second project
      const input2 = CreateProjectInputFakeBuilder.create()
        .withName('Second Project')
        .withPath('/second')
        .build();
      const project2 = await useCase.execute(input2);

      // Assert - Both projects should be stored
      const allProjects = repository.getAll();
      expect(allProjects).toHaveLength(2);
      expect(allProjects.find((p) => p.id === project1.id)).toBeDefined();
      expect(allProjects.find((p) => p.id === project2.id)).toBeDefined();
    });

    it('should enforce unique path constraint across operations', async () => {
      // Arrange
      const input = CreateProjectInputFakeBuilder.create()
        .withName('Original')
        .withPath('/unique/path')
        .build();

      // Act - Create first project
      await useCase.execute(input);

      // Act & Assert - Try to create duplicate
      const duplicateInput = CreateProjectInputFakeBuilder.create()
        .withName('Duplicate')
        .withPath('/unique/path')
        .build();

      await expect(useCase.execute(duplicateInput)).rejects.toThrow(DomainError);

      // Assert - Only one project should exist
      const allProjects = repository.getAll();
      expect(allProjects).toHaveLength(1);
      expect(allProjects[0].name).toBe('Original');
    });
  });

  describe('repository state management', () => {
    it('should store project with all fields populated', async () => {
      // Arrange
      const input = CreateProjectInputFakeBuilder.create()
        .withName('Full Fields Project')
        .withPath('/full')
        .withGameVersion('3.0.0')
        .withScreenshotPath('/screenshot.jpg')
        .build();

      // Act
      const result = await useCase.execute(input);

      // Assert - Verify all fields in repository
      const stored = await repository.findById(result.id);
      expect(stored).toMatchObject({
        name: 'Full Fields Project',
        path: '/full',
        gameVersion: '3.0.0',
        screenshotPath: '/screenshot.jpg',
        trechoCount: null,
      });
    });

    it('should store project with null optional fields', async () => {
      // Arrange
      const input = CreateProjectInputFakeBuilder.create()
        .withName('Minimal Project')
        .withPath('/minimal')
        .withoutGameVersion()
        .withoutScreenshotPath()
        .build();

      // Act
      const result = await useCase.execute(input);

      // Assert
      const stored = await repository.findById(result.id);
      expect(stored?.gameVersion).toBeNull();
      expect(stored?.screenshotPath).toBeNull();
    });

    it('should auto-generate IDs that are unique', async () => {
      // Arrange
      const inputs = [
        CreateProjectInputFakeBuilder.create().withPath('/path1').build(),
        CreateProjectInputFakeBuilder.create().withPath('/path2').build(),
        CreateProjectInputFakeBuilder.create().withPath('/path3').build(),
      ];

      // Act
      const projects = await Promise.all(inputs.map((input) => useCase.execute(input)));

      // Assert - All IDs should be unique
      const ids = projects.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });
  });

  describe('timestamp behavior in integration', () => {
    it('should set creation timestamp correctly', async () => {
      // Arrange
      const beforeCreate = new Date();
      const input = CreateProjectInputFakeBuilder.create().withPath('/timestamp-test').build();

      // Act
      const result = await useCase.execute(input);
      const afterCreate = new Date();

      // Assert
      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should set lastOpenedAt to creation time', async () => {
      // Arrange
      const input = CreateProjectInputFakeBuilder.create().withPath('/last-opened-test').build();

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.lastOpenedAt.getTime()).toBe(result.createdAt.getTime());
    });
  });

  describe('error handling in integration context', () => {
    it('should not create project when path is duplicate', async () => {
      // Arrange
      const firstInput = CreateProjectInputFakeBuilder.create()
        .withName('First')
        .withPath('/dup')
        .build();

      const secondInput = CreateProjectInputFakeBuilder.create()
        .withName('Second')
        .withPath('/dup')
        .build();

      // Act
      await useCase.execute(firstInput);

      // Act & Assert
      await expect(useCase.execute(secondInput)).rejects.toThrow(DomainError);

      // Assert - Verify state didn't change
      const allProjects = repository.getAll();
      expect(allProjects).toHaveLength(1);
      expect(allProjects[0].name).toBe('First');
    });

    it('should maintain data integrity on failed creation', async () => {
      // Arrange - Create one project
      await useCase.execute(CreateProjectInputFakeBuilder.create().withPath('/valid').build());

      const projectCountBefore = repository.getAll().length;

      // Act - Try to create duplicate (will fail)
      try {
        await useCase.execute(CreateProjectInputFakeBuilder.create().withPath('/valid').build());
      } catch {
        // Expected to fail
      }

      // Assert - Count should be unchanged
      const projectCountAfter = repository.getAll().length;
      expect(projectCountAfter).toBe(projectCountBefore);
    });
  });

  describe('pre-seeded data scenarios', () => {
    it('should work with pre-seeded repository data', async () => {
      // Arrange - Seed existing data
      const existingProject = CreateProjectOutputFakeBuilder.create().withPath('/existing').build();
      repository.seed([existingProject]);

      // Act - Create new project
      const input = CreateProjectInputFakeBuilder.create().withPath('/new').build();
      await useCase.execute(input);

      // Assert
      const allProjects = repository.getAll();
      expect(allProjects).toHaveLength(2);
      expect(allProjects.find((p) => p.path === '/existing')).toBeDefined();
      expect(allProjects.find((p) => p.path === '/new')).toBeDefined();
    });

    it('should enforce uniqueness against pre-seeded data', async () => {
      // Arrange
      const existingProject = CreateProjectOutputFakeBuilder.create()
        .withPath('/pre-seeded')
        .build();
      repository.seed([existingProject]);

      // Act & Assert
      const input = CreateProjectInputFakeBuilder.create().withPath('/pre-seeded').build();

      await expect(useCase.execute(input)).rejects.toThrow(DomainError);
    });
  });

  describe('repository isolation', () => {
    it('should use separate repository instance per test', async () => {
      // Arrange
      const repo1 = new ProjectRepositoryFake();
      const repo2 = new ProjectRepositoryFake();

      const useCase1 = new CreateProjectUseCase(repo1);
      const useCase2 = new CreateProjectUseCase(repo2);

      // Act
      await useCase1.execute(CreateProjectInputFakeBuilder.create().withPath('/repo1').build());
      await useCase2.execute(CreateProjectInputFakeBuilder.create().withPath('/repo2').build());

      // Assert - Repositories should be isolated
      expect(repo1.getAll()).toHaveLength(1);
      expect(repo2.getAll()).toHaveLength(1);
      expect(repo1.getAll()[0].path).toBe('/repo1');
      expect(repo2.getAll()[0].path).toBe('/repo2');
    });
  });
});
