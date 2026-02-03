import { SimulationHistoryEntry } from '../entities';

/**
 * Simulation History Filters
 */
export interface SimulationHistoryFilters {
  projectPath?: string;
  status?: string;
  ttkVersion?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Pagination params
 */
export interface PaginationParams {
  page: number;
  perPage: number;
}

/**
 * Search result with pagination metadata
 */
export interface SimulationHistorySearchResult {
  items: SimulationHistoryEntry[];
  filters: SimulationHistoryFilters;
  pagination: {
    total: number;
    page: number;
    perPage: number;
    lastPage: number;
  };
}

/**
 * Input Port: ISimulationHistoryRepository
 *
 * This interface defines the contract for simulation history persistence.
 * It's implemented by infrastructure layer (Prisma, InMemory).
 */
export interface ISimulationHistoryRepository {
  /**
   * Find a simulation entry by ID
   */
  findById(id: string): Promise<SimulationHistoryEntry | null>;

  /**
   * Search simulation entries with filters and pagination
   */
  search(
    filters: SimulationHistoryFilters,
    pagination: PaginationParams,
  ): Promise<SimulationHistorySearchResult>;

  /**
   * Insert a new simulation entry
   */
  insert(entry: SimulationHistoryEntry): Promise<void>;

  /**
   * Update an existing simulation entry
   */
  update(entry: SimulationHistoryEntry): Promise<void>;

  /**
   * Delete a simulation entry by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a simulation entry exists by ID
   */
  exists(id: string): Promise<boolean>;
}
