import { CreateProjectInput, CreateProjectOutput } from '../dto';
import { IProjectRepository } from '../ports';
import { DomainError } from '@core/shared/domain/errors';

/**
 * CreateProjectUseCase
 *
 * This is the Application Layer's core business logic orchestration.
 * It coordinates between the Domain Layer and Infrastructure Layer.
 *
 * RESPONSIBILITIES:
 * - Validate input (via DTO)
 * - Enforce business rules
 * - Coordinate repository operations
 * - Return output (via DTO)
 *
 * This use case is FRAMEWORK-AGNOSTIC. It has no dependencies on
 * NestJS, Prisma, Express, or any external framework.
 */
export class CreateProjectUseCase {
  constructor(private readonly projectRepository: IProjectRepository) {}

  /**
   * Execute the use case
   *
   * @param input - Validated input data
   * @returns Created project data
   * @throws DomainError if business rule is violated
   */
  async execute(input: CreateProjectInput): Promise<CreateProjectOutput> {
    // Business Rule: Project path must be unique
    const exists = await this.projectRepository.existsByPath(input.path);
    if (exists) {
      throw new DomainError(`Project with path "${input.path}" already exists`);
    }

    // Create the project
    const project = await this.projectRepository.create({
      name: input.name,
      path: input.path,
      gameVersion: input.gameVersion,
      screenshotPath: input.screenshotPath,
    });

    return project;
  }
}
