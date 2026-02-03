import type {
  IRecentProjectsRepository,
  RecentProjectSearchParams,
  RecentProjectSearchResult,
} from '@core/recent-projects/domain/ports/IRecentProjectsRepository';
import { RecentProject } from '@core/recent-projects/domain/recent-project.aggregate';

/**
 * In-Memory implementation of RecentProjects Repository
 *
 * This repository is primarily used for testing purposes.
 * It stores data in a JavaScript Map for fast access.
 */
export class RecentProjectsInMemoryRepository implements IRecentProjectsRepository {
  private readonly projects: Map<string, RecentProject> = new Map();

  async insert(project: RecentProject): Promise<void> {
    this.projects.set(project.path, project);
  }

  async update(project: RecentProject): Promise<void> {
    if (!this.projects.has(project.path)) {
      throw new Error(`Project with path "${project.path}" not found`);
    }
    this.projects.set(project.path, project);
  }

  async upsert(project: RecentProject): Promise<void> {
    this.projects.set(project.path, project);
  }

  async findByPath(path: string): Promise<RecentProject | null> {
    return this.projects.get(path) ?? null;
  }

  async findById(id: string): Promise<RecentProject | null> {
    for (const project of this.projects.values()) {
      if (project.id === id) {
        return project;
      }
    }
    return null;
  }

  async search(params: RecentProjectSearchParams): Promise<RecentProjectSearchResult> {
    const limit = params.limit ?? 10;
    const offset = params.offset ?? 0;

    // Filter projects
    let items = Array.from(this.projects.values());

    if (params.nameFilter) {
      const lowerFilter = params.nameFilter.toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(lowerFilter));
    }

    if (params.gameVersion) {
      items = items.filter((p) => p.gameVersion === params.gameVersion);
    }

    // Sort by lastOpenedAt descending
    items.sort((a, b) => b.lastOpenedAt.getTime() - a.lastOpenedAt.getTime());

    const total = items.length;
    const page = Math.floor(offset / limit) + 1;
    const lastPage = Math.ceil(total / limit);

    // Apply pagination
    const paginatedItems = items.slice(offset, offset + limit);

    return {
      items: paginatedItems,
      total,
      page,
      perPage: limit,
      lastPage,
    };
  }

  async delete(path: string): Promise<void> {
    if (!this.projects.has(path)) {
      throw new Error(`Project with path "${path}" not found`);
    }
    this.projects.delete(path);
  }

  async count(filters?: Partial<RecentProjectSearchParams>): Promise<number> {
    let items = Array.from(this.projects.values());

    if (filters?.nameFilter) {
      const lowerFilter = filters.nameFilter.toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(lowerFilter));
    }

    if (filters?.gameVersion) {
      items = items.filter((p) => p.gameVersion === filters.gameVersion);
    }

    return items.length;
  }

  async existsByPath(path: string): Promise<boolean> {
    return this.projects.has(path);
  }

  /**
   * Reset the repository (useful for testing)
   */
  reset(): void {
    this.projects.clear();
  }

  /**
   * Get all projects (useful for testing assertions)
   */
  getAll(): RecentProject[] {
    return Array.from(this.projects.values());
  }
}
