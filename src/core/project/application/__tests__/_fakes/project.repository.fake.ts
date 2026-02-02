import { IProjectRepository } from '../../ports';
import { CreateProjectOutput } from '../../dto';
import { CreateProjectOutputFakeBuilder } from './create-project-output.fake-builder';

/**
 * Fake Project Repository
 *
 * In-memory implementation of IProjectRepository for unit testing.
 * This is NOT a mock - it's a working in-memory repository that
 * implements the full contract defined by the port.
 *
 * USAGE:
 * ```ts
 * const repository = new ProjectRepositoryFake();
 * await repository.create({ name: 'Test', path: '/test' });
 * const projects = await repository.findByPath('/test');
 * ```
 */
export class ProjectRepositoryFake implements IProjectRepository {
  private projects: Map<string, CreateProjectOutput> = new Map();

  async existsByPath(path: string): Promise<boolean> {
    const projects = Array.from(this.projects.values());
    return projects.some((p) => p.path === path);
  }

  async create(data: {
    name: string;
    path: string;
    gameVersion?: string;
    screenshotPath?: string;
  }): Promise<CreateProjectOutput> {
    const project = CreateProjectOutputFakeBuilder.create()
      .withName(data.name)
      .withPath(data.path)
      .withGameVersion(data.gameVersion ?? null)
      .withScreenshotPath(data.screenshotPath ?? null)
      .build();

    this.projects.set(project.id, project);
    return project;
  }

  async findById(id: string): Promise<CreateProjectOutput | null> {
    return this.projects.get(id) ?? null;
  }

  async updateLastOpened(id: string): Promise<void> {
    const project = this.projects.get(id);
    if (project) {
      const updated = {
        ...project,
        lastOpenedAt: new Date(),
        updatedAt: new Date(),
      };
      this.projects.set(id, updated);
    }
  }

  /**
   * Helper method for testing - get all projects
   */
  getAll(): CreateProjectOutput[] {
    return Array.from(this.projects.values());
  }

  /**
   * Helper method for testing - clear all data
   */
  clear(): void {
    this.projects.clear();
  }

  /**
   * Helper method for testing - set up existing data
   */
  seed(projects: CreateProjectOutput[]): void {
    projects.forEach((p) => this.projects.set(p.id, p));
  }
}
