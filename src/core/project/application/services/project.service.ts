import { CreateProjectInput, CreateProjectOutput } from '../dto';
import { CreateProjectUseCase, GetProjectUseCase } from '../use-cases';

/**
 * ProjectService
 *
 * Application Service that coordinates multiple use cases.
 * This is the facade that outer layers (Controllers/Resolvers) interact with.
 *
 * RESPONSIBILITIES:
 * - Orchestrate multiple use cases
 * - Provide a high-level API for the application
 * - No business logic (delegates to use cases)
 */
export class ProjectService {
  constructor(
    private readonly createProjectUseCase: CreateProjectUseCase,
    private readonly getProjectUseCase: GetProjectUseCase,
  ) {}

  /**
   * Create a new project
   */
  async createProject(input: CreateProjectInput): Promise<CreateProjectOutput> {
    return this.createProjectUseCase.execute(input);
  }

  /**
   * Get a project by ID
   */
  async getProject(id: string): Promise<CreateProjectOutput> {
    return this.getProjectUseCase.execute(id);
  }

  /**
   * Example of coordinating multiple use cases
   * Get or create project (useful for "open recent" functionality)
   */
  async getOrCreate(input: CreateProjectInput): Promise<{ project: CreateProjectOutput; created: boolean }> {
    try {
      const project = await this.getProjectUseCase.execute(input.path);
      return { project, created: false };
    } catch {
      const project = await this.createProjectUseCase.execute(input);
      return { project, created: true };
    }
  }
}
