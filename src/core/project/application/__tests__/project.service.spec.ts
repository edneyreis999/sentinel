/**
 * ProjectService - Unit Tests
 *
 * STRATEGY: Application Service Testing
 *
 * Tests the service that ORCHESTRATES multiple use cases.
 * Uses MOCKED use cases to verify coordination logic.
 *
 * CHECKLIST:
 * - [x] Unit under test: ProjectService (orchestration layer)
 * - [x] Expected behavior: Coordinates use cases correctly
 * - [x] Bug localization: Fails when coordination changes
 * - [x] Business rules: Delegates rules to use cases (no logic here)
 */

import { ProjectService } from '../services/project.service';
import { CreateProjectUseCase, GetProjectUseCase } from '../use-cases';
import { CreateProjectInputFakeBuilder, CreateProjectOutputFakeBuilder } from './_fakes';

describe('ProjectService', () => {
  let service: ProjectService;
  let createProjectUseCase: jest.Mocked<CreateProjectUseCase>;
  let getProjectUseCase: jest.Mocked<GetProjectUseCase>;

  beforeEach(() => {
    // Create mocked use cases
    createProjectUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateProjectUseCase>;

    getProjectUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetProjectUseCase>;

    service = new ProjectService(createProjectUseCase, getProjectUseCase);
  });

  describe('createProject', () => {
    it('should delegate to CreateProjectUseCase', async () => {
      // Arrange
      const input = CreateProjectInputFakeBuilder.create().build();
      const expectedOutput = CreateProjectOutputFakeBuilder.create().build();
      createProjectUseCase.execute.mockResolvedValue(expectedOutput);

      // Act
      const result = await service.createProject(input);

      // Assert
      expect(createProjectUseCase.execute).toHaveBeenCalledWith(input);
      expect(createProjectUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedOutput);
    });

    it('should propagate errors from use case', async () => {
      // Arrange
      const input = CreateProjectInputFakeBuilder.create().build();
      const error = new Error('Use case error');
      createProjectUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(service.createProject(input)).rejects.toThrow('Use case error');
    });
  });

  describe('getProject', () => {
    it('should delegate to GetProjectUseCase', async () => {
      // Arrange
      const id = 'project-123';
      const expectedOutput = CreateProjectOutputFakeBuilder.create().withId(id).build();
      getProjectUseCase.execute.mockResolvedValue(expectedOutput);

      // Act
      const result = await service.getProject(id);

      // Assert
      expect(getProjectUseCase.execute).toHaveBeenCalledWith(id);
      expect(getProjectUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedOutput);
    });

    it('should propagate errors from use case', async () => {
      // Arrange
      const id = 'non-existent';
      const error = new Error('Project not found');
      getProjectUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getProject(id)).rejects.toThrow('Project not found');
    });
  });

  describe('getOrCreate', () => {
    it('should return existing project when found', async () => {
      // Arrange
      const input = CreateProjectInputFakeBuilder.create().withPath('/existing/path').build();
      const existingProject = CreateProjectOutputFakeBuilder.create()
        .withPath('/existing/path')
        .build();

      getProjectUseCase.execute.mockResolvedValue(existingProject);

      // Act
      const result = await service.getOrCreate(input);

      // Assert
      expect(result.project).toEqual(existingProject);
      expect(result.created).toBe(false);
      expect(getProjectUseCase.execute).toHaveBeenCalledWith(input.path);
      expect(createProjectUseCase.execute).not.toHaveBeenCalled();
    });

    it('should create new project when not found', async () => {
      // Arrange
      const input = CreateProjectInputFakeBuilder.create().withPath('/new/path').build();
      const newProject = CreateProjectOutputFakeBuilder.create().withPath('/new/path').build();

      getProjectUseCase.execute.mockRejectedValue(new Error('Not found'));
      createProjectUseCase.execute.mockResolvedValue(newProject);

      // Act
      const result = await service.getOrCreate(input);

      // Assert
      expect(result.project).toEqual(newProject);
      expect(result.created).toBe(true);
      expect(getProjectUseCase.execute).toHaveBeenCalledWith(input.path);
      expect(createProjectUseCase.execute).toHaveBeenCalledWith(input);
    });

    it('should use path as ID for getProject lookup', async () => {
      // Arrange
      const input = CreateProjectInputFakeBuilder.create().withPath('/specific/path').build();
      const existingProject = CreateProjectOutputFakeBuilder.create().build();

      getProjectUseCase.execute.mockResolvedValue(existingProject);

      // Act
      await service.getOrCreate(input);

      // Assert
      expect(getProjectUseCase.execute).toHaveBeenCalledWith('/specific/path');
    });

    it('should fallback to create when get throws any error', async () => {
      // Arrange
      const input = CreateProjectInputFakeBuilder.create().build();
      const unexpectedError = new Error('Database connection failed');
      const newProject = CreateProjectOutputFakeBuilder.create().build();

      getProjectUseCase.execute.mockRejectedValue(unexpectedError);
      createProjectUseCase.execute.mockResolvedValue(newProject);

      // Act
      const result = await service.getOrCreate(input);

      // Assert - Should fallback to create and return successfully
      expect(result.project).toEqual(newProject);
      expect(result.created).toBe(true);
      expect(createProjectUseCase.execute).toHaveBeenCalledWith(input);
    });

    it('should propagate errors during create after get fails', async () => {
      // Arrange
      const input = CreateProjectInputFakeBuilder.create().build();
      const getError = new Error('Not found');
      const createError = new Error('Validation failed');

      getProjectUseCase.execute.mockRejectedValue(getError);
      createProjectUseCase.execute.mockRejectedValue(createError);

      // Act & Assert
      await expect(service.getOrCreate(input)).rejects.toThrow('Validation failed');
    });
  });

  describe('coordination patterns', () => {
    it('should handle multiple sequential operations', async () => {
      // Arrange
      const input1 = CreateProjectInputFakeBuilder.create().withPath('/path1').build();
      const input2 = CreateProjectInputFakeBuilder.create().withPath('/path2').build();

      const project1 = CreateProjectOutputFakeBuilder.create().withPath('/path1').build();
      const project2 = CreateProjectOutputFakeBuilder.create().withPath('/path2').build();

      createProjectUseCase.execute.mockResolvedValueOnce(project1).mockResolvedValueOnce(project2);

      // Act
      const result1 = await service.createProject(input1);
      const result2 = await service.createProject(input2);

      // Assert
      expect(result1).toEqual(project1);
      expect(result2).toEqual(project2);
      expect(createProjectUseCase.execute).toHaveBeenCalledTimes(2);
    });

    it('should maintain separation between create and get operations', async () => {
      // Arrange
      const id = 'project-123';
      const input = CreateProjectInputFakeBuilder.create().build();

      const project = CreateProjectOutputFakeBuilder.create().withId(id).build();

      getProjectUseCase.execute.mockResolvedValue(project);
      createProjectUseCase.execute.mockResolvedValue(project);

      // Act
      const getResult = await service.getProject(id);
      const createResult = await service.createProject(input);

      // Assert
      expect(getResult).toEqual(project);
      expect(createResult).toEqual(project);
      expect(getProjectUseCase.execute).toHaveBeenCalledWith(id);
      expect(createProjectUseCase.execute).toHaveBeenCalledWith(input);
      expect(getProjectUseCase.execute).not.toHaveBeenCalledWith(input);
    });
  });
});
