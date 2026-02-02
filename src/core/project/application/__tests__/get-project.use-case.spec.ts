/**
 * GetProjectUseCase - Unit Tests
 *
 * STRATEGY: Application Layer Testing
 *
 * CHECKLIST:
 * - [x] Unit under test: GetProjectUseCase
 * - [x] Expected behavior: Returns project if found, throws if not found
 * - [x] Bug localization: Fails when lookup logic changes
 * - [x] Business rules: Validates "project must exist" rule
 */

import { GetProjectUseCase } from '../use-cases/get-project.use-case';
import { IProjectRepository } from '../ports';
import { DomainError } from '@core/shared/domain/errors';
import {
  CreateProjectOutputFakeBuilder,
  ProjectRepositoryFake,
} from './_fakes';

describe('GetProjectUseCase', () => {
  let useCase: GetProjectUseCase;
  let repository: IProjectRepository;

  beforeEach(() => {
    repository = new ProjectRepositoryFake();
    useCase = new GetProjectUseCase(repository);
  });

  describe('happy path', () => {
    it('should return project when it exists', async () => {
      // Arrange
      const existingProject = CreateProjectOutputFakeBuilder.create()
        .withId('project-123')
        .withName('Existing Project')
        .build();

      (repository as ProjectRepositoryFake).seed([existingProject]);

      // Act
      const result = await useCase.execute('project-123');

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('project-123');
      expect(result.name).toBe('Existing Project');
    });

    it('should return project with null optional fields', async () => {
      // Arrange
      const projectWithNulls = CreateProjectOutputFakeBuilder.create()
        .withId('nulls-project')
        .withGameVersion(null)
        .withScreenshotPath(null)
        .withTrechoCount(null)
        .build();

      (repository as ProjectRepositoryFake).seed([projectWithNulls]);

      // Act
      const result = await useCase.execute('nulls-project');

      // Assert
      expect(result.gameVersion).toBeNull();
      expect(result.screenshotPath).toBeNull();
      expect(result.trechoCount).toBeNull();
    });
  });

  describe('error cases', () => {
    it('should throw DomainError when project does not exist', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act & Assert
      await expect(useCase.execute(nonExistentId)).rejects.toThrow(DomainError);
      await expect(useCase.execute(nonExistentId)).rejects.toThrow(
        'Project with ID "non-existent-id" not found',
      );
    });

    it('should throw DomainError with empty string ID', async () => {
      // Arrange
      const emptyId = '';

      // Act & Assert
      await expect(useCase.execute(emptyId)).rejects.toThrow(DomainError);
    });

    it('should throw DomainError for malformed ID format', async () => {
      // Arrange - Note: In real app, might validate ID format (UUID, CUID, etc.)
      const malformedId = 'not-a-real-id';

      // Act & Assert
      await expect(useCase.execute(malformedId)).rejects.toThrow(DomainError);
    });
  });

  describe('edge cases', () => {
    it('should handle finding project with numeric-like ID', async () => {
      // Arrange - Some systems use numeric IDs as strings
      const numericIdProject = CreateProjectOutputFakeBuilder.create()
        .withId('12345')
        .build();

      (repository as ProjectRepositoryFake).seed([numericIdProject]);

      // Act
      const result = await useCase.execute('12345');

      // Assert
      expect(result.id).toBe('12345');
    });

    it('should handle finding project with special characters in ID', async () => {
      // Arrange - Some IDs might contain special chars
      const specialIdProject = CreateProjectOutputFakeBuilder.create()
        .withId('project-with-dashes_and_underscores')
        .build();

      (repository as ProjectRepositoryFake).seed([specialIdProject]);

      // Act
      const result = await useCase.execute('project-with-dashes_and_underscores');

      // Assert
      expect(result.id).toBe('project-with-dashes_and_underscores');
    });
  });

  describe('integration with repository', () => {
    it('should call repository.findById with correct ID', async () => {
      // Arrange
      const findByIdSpy = jest.spyOn(repository, 'findById').mockResolvedValue(
        CreateProjectOutputFakeBuilder.create().build(),
      );

      // Act
      await useCase.execute('test-id');

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith('test-id');
      expect(findByIdSpy).toHaveBeenCalledTimes(1);
    });

    it('should return exactly what repository returns', async () => {
      // Arrange
      const expectedProject = CreateProjectOutputFakeBuilder.create()
        .withName('Repository Test')
        .build();

      jest.spyOn(repository, 'findById').mockResolvedValue(expectedProject);

      // Act
      const result = await useCase.execute('any-id');

      // Assert
      expect(result).toEqual(expectedProject);
    });
  });
});
