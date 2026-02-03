import type { IListRecentProjectsUseCase } from '../../ports/in/IListRecentProjectsUseCase';
import type { IRecentProjectsRepository } from '@core/recent-projects/domain/ports/IRecentProjectsRepository';
import type { ListRecentProjectsInput } from '../../dto/input/list-recent-projects.input';
import { RecentProjectsSearchResultDTO } from '../../dto/output/recent-projects-search-result.dto';
import { DomainError } from '@core/shared/domain/errors';

/**
 * List Recent Projects Use Case
 *
 * Application Layer business logic orchestration for listing
 * recent project entries with filtering and pagination.
 *
 * Responsibilities:
 * - Validate input parameters
 * - Apply default values for pagination
 * - Coordinate repository search
 * - Return paginated output DTO
 *
 * This use case is FRAMEWORK-AGNOSTIC.
 */
export class ListRecentProjectsUseCase implements IListRecentProjectsUseCase {
  constructor(private readonly repository: IRecentProjectsRepository) {}

  /**
   * Execute the use case
   *
   * @param input - Search parameters (optional filters and pagination)
   * @returns Paginated list of recent projects
   */
  async execute(input: ListRecentProjectsInput): Promise<RecentProjectsSearchResultDTO> {
    // Apply defaults
    const limit = input.limit ?? 10;
    const offset = input.offset ?? 0;

    // Validate limits
    if (limit < 1) {
      throw new DomainError('Limit must be at least 1');
    }

    if (limit > 100) {
      throw new DomainError('Limit cannot exceed 100');
    }

    if (offset < 0) {
      throw new DomainError('Offset cannot be negative');
    }

    // Execute search
    const result = await this.repository.search({
      limit,
      offset,
      nameFilter: input.nameFilter,
      gameVersion: input.gameVersion,
    });

    return RecentProjectsSearchResultDTO.fromDomain(result.items, {
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      lastPage: result.lastPage,
    });
  }
}
