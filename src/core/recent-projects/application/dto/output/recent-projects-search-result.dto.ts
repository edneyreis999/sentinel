import { RecentProject } from '../../../domain/recent-project.aggregate';
import { RecentProjectOutputDTO } from './recent-project.output.dto';

/**
 * Output DTO for paginated search results
 */
export class RecentProjectsSearchResultDTO {
  readonly items!: RecentProjectOutputDTO[];
  readonly total!: number;
  readonly page!: number;
  readonly perPage!: number;
  readonly lastPage!: number;

  private constructor(data: RecentProjectsSearchResultDTO) {
    Object.assign(this, data);
  }

  /**
   * Factory Method: Convert domain search result to DTO
   */
  static fromDomain(
    items: RecentProject[],
    pagination: {
      total: number;
      page: number;
      perPage: number;
      lastPage: number;
    },
  ): RecentProjectsSearchResultDTO {
    return new RecentProjectsSearchResultDTO({
      items: RecentProjectOutputDTO.fromDomainArray(items),
      total: pagination.total,
      page: pagination.page,
      perPage: pagination.perPage,
      lastPage: pagination.lastPage,
    });
  }
}
