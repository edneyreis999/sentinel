import { ListRecentProjectsInput } from '../../dto/input/list-recent-projects.input';
import { RecentProjectsSearchResultDTO } from '../../dto/output/recent-projects-search-result.dto';

/**
 * Input Port for List Recent Projects Use Case
 *
 * Defines the contract for listing recent projects with filtering and pagination.
 * Implementations must handle business logic and return OutputDTO.
 */
export interface IListRecentProjectsUseCase {
  execute(input: ListRecentProjectsInput): Promise<RecentProjectsSearchResultDTO>;
}
