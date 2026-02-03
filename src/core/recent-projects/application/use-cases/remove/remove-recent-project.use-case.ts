import type { IRemoveRecentProjectUseCase } from '../../ports/in/IRemoveRecentProjectUseCase';
import type { IRecentProjectsRepository } from '@core/recent-projects/domain/ports/IRecentProjectsRepository';
import type { RemoveRecentProjectInput } from '../../dto/input/remove-recent-project.input';
import { DomainError } from '@core/shared/domain/errors';

/**
 * Remove Recent Project Use Case
 *
 * Application Layer business logic orchestration for removing
 * a recent project entry.
 *
 * Responsibilities:
 * - Validate input
 * - Check if project exists before deletion
 * - Coordinate repository deletion
 *
 * This use case is FRAMEWORK-AGNOSTIC.
 */
export class RemoveRecentProjectUseCase implements IRemoveRecentProjectUseCase {
  constructor(private readonly repository: IRecentProjectsRepository) {}

  /**
   * Execute the use case
   *
   * Business Rules:
   * - Project must exist before deletion
   *
   * @param input - Path of project to remove
   * @throws DomainError if project not found
   */
  async execute(input: RemoveRecentProjectInput): Promise<void> {
    // Validate input
    if (!input.path || input.path.trim().length === 0) {
      throw new DomainError('Project path is required');
    }

    // Business Rule: Check if project exists
    const exists = await this.repository.existsByPath(input.path);

    if (!exists) {
      throw new DomainError(`Recent project with path "${input.path}" not found`);
    }

    // Delete the project
    await this.repository.delete(input.path);
  }
}
