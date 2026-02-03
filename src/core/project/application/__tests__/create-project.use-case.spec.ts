/**
 * CreateProjectUseCase - Unit Tests
 *
 * STRATEGY: Application Layer Testing
 *
 * These tests validate the USE CASE BEHAVIOR with a fake repository.
 * They are UNIT TESTS because they test a single use case in isolation.
 *
 * CHECKLIST BEFORE RUNNING:
 * - [x] What unit is under test? CreateProjectUseCase
 * - [x] What is the expected behavior? Creates project if path is unique, throws if duplicate
 * - [x] How to locate future bugs? Fail when business rules change, test coverage reports
 * - [x] Does it validate business rules? Yes - unique path constraint
 */

import { CreateProjectUseCase } from '../use-cases/create-project.use-case';
import { IProjectRepository } from '../ports';
import { DomainError } from '@core/shared/domain/errors';
import {
  CreateProjectInputFakeBuilder,
  CreateProjectOutputFakeBuilder,
  ProjectRepositoryFake,
} from './_fakes';

describe('CreateProjectUseCase', () => {
  let useCase: CreateProjectUseCase;
  let repository: IProjectRepository;

  beforeEach(() => {
    // Use fake repository for unit testing (in-memory, no database)
    repository = new ProjectRepositoryFake();
    useCase = new CreateProjectUseCase(repository);
  });

  describe('happy path', () => {
    it('should create a project when input is valid', async () => {
      // Arrange
      const input = CreateProjectInputFakeBuilder.create()
        .withName('Test Project')
        .withPath('/test/path')
        .build();

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe('Test Project');
      expect(result.path).toBe('/test/path');
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should create a project with optional fields', async () => {
      // Arrange
      const input = CreateProjectInputFakeBuilder.create()
        .withName('Project without version')
        .withPath('/another/path')
        .withoutGameVersion()
        .withoutScreenshotPath()
        .build();

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.name).toBe('Project without version');
      expect(result.gameVersion).toBeNull();
      expect(result.screenshotPath).toBeNull();
    });

    it('should create a project with all optional fields provided', async () => {
      // Arrange
      const input = CreateProjectInputFakeBuilder.create()
        .withName('Full Project')
        .withPath('/full/path')
        .withGameVersion('2.5.0')
        .withScreenshotPath('/screenshot.png')
        .build();

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.gameVersion).toBe('2.5.0');
      expect(result.screenshotPath).toBe('/screenshot.png');
    });
  });

  describe('business rules', () => {
    it('should throw DomainError when project path already exists', async () => {
      // Arrange
      const existingProject = CreateProjectOutputFakeBuilder.create()
        .withPath('/existing/path')
        .build();
      (repository as ProjectRepositoryFake).seed([existingProject]);

      const input = CreateProjectInputFakeBuilder.create()
        .withName('New Project')
        .withPath('/existing/path') // Same path as existing
        .build();

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(DomainError);
      await expect(useCase.execute(input)).rejects.toThrow(
        'Project with path "/existing/path" already exists',
      );
    });

    it('should allow creating projects with different paths', async () => {
      // Arrange
      const firstInput = CreateProjectInputFakeBuilder.create()
        .withName('First Project')
        .withPath('/first/path')
        .build();

      const secondInput = CreateProjectInputFakeBuilder.create()
        .withName('Second Project')
        .withPath('/second/path')
        .build();

      // Act
      const first = await useCase.execute(firstInput);
      const second = await useCase.execute(secondInput);

      // Assert
      expect(first.id).not.toBe(second.id);
      expect(first.path).toBe('/first/path');
      expect(second.path).toBe('/second/path');
    });

    it('should set timestamps correctly', async () => {
      // Arrange
      const beforeCreate = new Date();
      const input = CreateProjectInputFakeBuilder.create()
        .withName('Timestamp Test')
        .withPath('/timestamp/path')
        .build();

      // Act
      const result = await useCase.execute(input);
      const afterCreate = new Date();

      // Assert
      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(result.lastOpenedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    });

    it('should initialize trechoCount as null', async () => {
      // Arrange
      const input = CreateProjectInputFakeBuilder.create()
        .withName('Trecho Count Test')
        .withPath('/trecho/path')
        .build();

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.trechoCount).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle project names with special characters', async () => {
      // Arrange
      const input = CreateProjectInputFakeBuilder.create()
        .withName('Project with émojis 🎮 and spëcial çhars')
        .withPath('/special/chars/path')
        .build();

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.name).toBe('Project with émojis 🎮 and spëcial çhars');
    });

    it('should handle long project paths', async () => {
      // Arrange
      const longPath = '/very/long/path/that/goes/deep/into/the/directory/structure/and/continues';
      const input = CreateProjectInputFakeBuilder.create()
        .withName('Deep Path Project')
        .withPath(longPath)
        .build();

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.path).toBe(longPath);
    });

    it('should handle project names at minimum length (3 chars)', async () => {
      // Arrange
      const input = CreateProjectInputFakeBuilder.create()
        .withName('ABC')
        .withPath('/abc/path')
        .build();

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.name).toBe('ABC');
    });
  });

  describe('integration with repository', () => {
    it('should call repository.existsByPath before creating', async () => {
      // Arrange
      const existsByPathSpy = jest.spyOn(repository, 'existsByPath').mockResolvedValue(false);
      const createSpy = jest
        .spyOn(repository, 'create')
        .mockResolvedValue(CreateProjectOutputFakeBuilder.create().build());

      const input = CreateProjectInputFakeBuilder.create().build();

      // Act
      await useCase.execute(input);

      // Assert
      expect(existsByPathSpy).toHaveBeenCalledWith(input.path);
      expect(createSpy).toHaveBeenCalledWith({
        name: input.name,
        path: input.path,
        gameVersion: input.gameVersion,
        screenshotPath: input.screenshotPath,
      });
      // Both spies should have been called
      expect(existsByPathSpy).toHaveBeenCalledTimes(1);
      expect(createSpy).toHaveBeenCalledTimes(1);
    });

    it('should NOT call repository.create when path exists', async () => {
      // Arrange
      jest.spyOn(repository, 'existsByPath').mockResolvedValue(true);
      const createSpy = jest.spyOn(repository, 'create');

      const input = CreateProjectInputFakeBuilder.create().build();

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(DomainError);
      expect(createSpy).not.toHaveBeenCalled();
    });
  });
});
