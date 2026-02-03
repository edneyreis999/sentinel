import type { ICreateRecentProjectUseCase } from '../../ports/in/ICreateRecentProjectUseCase';
import type { IRecentProjectsRepository } from '@core/recent-projects/domain/ports/IRecentProjectsRepository';
import type { CreateRecentProjectInput } from '../../dto/input/create-recent-project.input';
import { RecentProjectOutputDTO } from '../../dto/output/recent-project.output.dto';
import { RecentProject } from '@core/recent-projects/domain/recent-project.aggregate';

/**
 * Create Recent Project Use Case
 *
 * Application Layer business logic orchestration for creating/updating
 * a recent project entry.
 *
 * Responsibilities:
 * - Validate input
 * - Enforce business rules (upsert on path uniqueness)
 * - Coordinate repository operations
 * - Return output DTO
 *
 * This use case is FRAMEWORK-AGNOSTIC. It has no dependencies on
 * NestJS, Prisma, Express, or any external framework.
 */
export class CreateRecentProjectUseCase implements ICreateRecentProjectUseCase {
  constructor(private readonly repository: IRecentProjectsRepository) {}

  /**
   * Execute the use case
   *
   * Business Rules:
   * - If project with same path exists, update lastOpenedAt
   * - If not exists, create new project entry
   *
   * @param input - Validated input data
   * @returns Created/updated project data
   * @throws DomainError if business rule is violated
   */
  async execute(input: CreateRecentProjectInput): Promise<RecentProjectOutputDTO> {
    // Business Rule: Check if project already exists by path
    const existing = await this.repository.findByPath(input.path);

    if (existing) {
      // Update existing project's last opened timestamp
      const updated = existing.updateLastOpened();

      // Also update metadata if provided
      const withMetadata = updated.updateMetadata({
        name: input.name,
        gameVersion: input.gameVersion,
        screenshotPath: input.screenshotPath,
        trechoCount: input.trechoCount,
      });

      await this.repository.upsert(withMetadata);

      return RecentProjectOutputDTO.fromDomain(withMetadata);
    }

    // Create new project
    const project = RecentProject.create({
      path: input.path,
      name: input.name,
      gameVersion: input.gameVersion,
      screenshotPath: input.screenshotPath,
      trechoCount: input.trechoCount,
    });

    await this.repository.upsert(project);

    return RecentProjectOutputDTO.fromDomain(project);
  }
}
