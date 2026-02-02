import { CreateProjectOutput } from '../dto';

/**
 * ProjectRepository Port (Output Port)
 *
 * This interface is part of the Dependency Inversion Principle.
 * The Application Layer defines the contract, Infrastructure Layer implements it.
 *
 * This is the "Repository" interface that the Use Case depends on.
 * The actual implementation (Prisma, in-memory, etc.) is provided by the Infrastructure Layer.
 */
export interface IProjectRepository {
  /**
   * Check if a project with the given path already exists
   */
  existsByPath(path: string): Promise<boolean>;

  /**
   * Create a new project
   */
  create(data: {
    name: string;
    path: string;
    gameVersion?: string;
    screenshotPath?: string;
  }): Promise<CreateProjectOutput>;

  /**
   * Find a project by ID
   */
  findById(id: string): Promise<CreateProjectOutput | null>;

  /**
   * Update the last opened timestamp
   */
  updateLastOpened(id: string): Promise<void>;
}
