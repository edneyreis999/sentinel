import { RecentProject } from '../recent-project.aggregate';

export interface RecentProjectSearchParams {
  limit?: number;
  offset?: number;
  nameFilter?: string;
  gameVersion?: string;
}

export interface RecentProjectSearchResult {
  items: RecentProject[];
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
}

/**
 * RecentProjects Repository Port (Output Port)
 *
 * This interface is part of the Dependency Inversion Principle.
 * The Domain Layer defines the contract, Infrastructure Layer implements it.
 *
 * This is the "Repository" interface that Use Cases depend on.
 * The actual implementation (Prisma, in-memory, etc.) is provided by the Infrastructure Layer.
 */
export interface IRecentProjectsRepository {
  /**
   * Insert a new recent project
   */
  insert(project: RecentProject): Promise<void>;

  /**
   * Update an existing recent project
   */
  update(project: RecentProject): Promise<void>;

  /**
   * Upsert a recent project (insert or update)
   */
  upsert(project: RecentProject): Promise<void>;

  /**
   * Find a project by path
   */
  findByPath(path: string): Promise<RecentProject | null>;

  /**
   * Find a project by ID
   */
  findById(id: string): Promise<RecentProject | null>;

  /**
   * Search projects with filters and pagination
   */
  search(params: RecentProjectSearchParams): Promise<RecentProjectSearchResult>;

  /**
   * Delete a project by path
   */
  delete(path: string): Promise<void>;

  /**
   * Count total projects
   */
  count(filters?: Partial<RecentProjectSearchParams>): Promise<number>;

  /**
   * Check if a project exists by path
   */
  existsByPath(path: string): Promise<boolean>;
}
