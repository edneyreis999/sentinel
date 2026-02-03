import {
  ISimulationHistoryRepository,
  SimulationHistoryFilters,
  PaginationParams,
  SimulationHistorySearchResult,
  SimulationHistoryEntry,
} from '../../../domain';

/**
 * SimulationHistoryInMemoryRepository
 *
 * In-memory implementation of ISimulationHistoryRepository for testing.
 * Stores entities in a Map for O(1) lookup by ID.
 *
 * This class is in the Infrastructure Layer and is used primarily for testing.
 */
export class SimulationHistoryInMemoryRepository implements ISimulationHistoryRepository {
  private readonly items: Map<string, SimulationHistoryEntry> = new Map();

  async findById(id: string): Promise<SimulationHistoryEntry | null> {
    return this.items.get(id) ?? null;
  }

  async search(
    filters: SimulationHistoryFilters,
    pagination: PaginationParams,
  ): Promise<SimulationHistorySearchResult> {
    const { page = 1, perPage = 20 } = pagination;

    let filtered = Array.from(this.items.values());

    // Apply filters
    if (filters.projectPath) {
      filtered = filtered.filter((item) =>
        item.projectPath.toLowerCase().includes(filters.projectPath!.toLowerCase()),
      );
    }

    if (filters.status) {
      filtered = filtered.filter((item) => item.status === filters.status);
    }

    if (filters.ttkVersion) {
      filtered = filtered.filter((item) => item.ttkVersion === filters.ttkVersion);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter((item) => item.timestamp >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      filtered = filtered.filter((item) => item.timestamp <= filters.dateTo!);
    }

    // Sort by timestamp descending
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const total = filtered.length;
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const items = filtered.slice(start, end);

    return {
      items,
      filters,
      pagination: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage),
      },
    };
  }

  async insert(entry: SimulationHistoryEntry): Promise<void> {
    this.items.set(entry.id, entry);
  }

  async update(entry: SimulationHistoryEntry): Promise<void> {
    this.items.set(entry.id, entry);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.items.has(id);
  }

  /**
   * Utility method for testing: Get all items
   */
  getAll(): SimulationHistoryEntry[] {
    return Array.from(this.items.values());
  }

  /**
   * Utility method for testing: Clear all items
   */
  clear(): void {
    this.items.clear();
  }

  /**
   * Utility method for testing: Seed with initial data
   */
  seed(entries: SimulationHistoryEntry[]): void {
    entries.forEach((entry) => this.items.set(entry.id, entry));
  }
}
