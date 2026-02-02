import { IProjectRepository } from '../ports';
import { CreateProjectOutput } from '../dto';
import { DomainError } from '@core/shared/domain/errors';

/**
 * GetProjectUseCase
 *
 * Retrieves a project by ID.
 * Throws DomainError if project is not found.
 */
export class GetProjectUseCase {
  constructor(private readonly projectRepository: IProjectRepository) {}

  async execute(id: string): Promise<CreateProjectOutput> {
    const project = await this.projectRepository.findById(id);

    if (!project) {
      throw new DomainError(`Project with ID "${id}" not found`);
    }

    return project;
  }
}
