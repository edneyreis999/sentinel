import { ISimulationHistoryRepository, PaginationParams } from '../../domain';
import {
  ListSimulationHistoryInput,
  SimulationHistorySearchOutput,
  toSimulationHistoryEntryOutput,
} from '../dto';
import { DomainError } from '@core/shared/domain/errors';

/**
 * ListSimulationHistoryUseCase
 *
 * Application Layer use case for listing simulation history entries
 * with filters and pagination.
 *
 * RESPONSIBILITIES:
 * - Apply default pagination values
 * - Call repository search method
 * - Transform domain entities to output DTOs
 *
 * This use case is FRAMEWORK-AGNOSTIC.
 */
export class ListSimulationHistoryUseCase {
  constructor(private readonly simulationHistoryRepository: ISimulationHistoryRepository) {}

  /**
   * Execute the use case
   *
   * @param input - Filters and optional pagination
   * @returns Paginated search result
   */
  async execute(input: ListSimulationHistoryInput = {}): Promise<SimulationHistorySearchOutput> {
    // Apply default pagination
    const pagination: PaginationParams = {
      page: input.pagination?.page ?? 1,
      perPage: input.pagination?.perPage ?? 20,
    };

    // Validate pagination
    if (pagination.page < 1) {
      throw new DomainError('Page must be greater than 0');
    }
    if (pagination.perPage < 1 || pagination.perPage > 100) {
      throw new DomainError('PerPage must be between 1 and 100');
    }

    const filters = input.filters ?? {};

    // Search in repository
    const result = await this.simulationHistoryRepository.search(filters, pagination);

    // Transform domain entities to output DTOs
    return {
      items: result.items.map(toSimulationHistoryEntryOutput),
      filters: result.filters,
      pagination: result.pagination,
    };
  }
}
