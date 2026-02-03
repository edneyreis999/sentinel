import { RecentProjectOutputDTO } from '@core/recent-projects/application/dto/output/recent-project.output.dto';
import { RecentProjectsSearchResultDTO } from '@core/recent-projects/application/dto/output/recent-projects-search-result.dto';
import { validateResponse } from '@core/shared/infra/validation/validateResponse';
import {
  RecentProjectResponseSchema,
  RecentProjectsListResponseSchema,
  SuccessResponseSchema,
} from './schemas/recent-projects.schemas';

/**
 * RecentProjectsPresenter
 *
 * Converts Output DTOs from use cases into HTTP response format.
 * Handles Date serialization to ISO strings.
 */
export class RecentProjectsPresenter {
  /**
   * Convert single project DTO to HTTP response
   */
  static toHttp(dto: RecentProjectOutputDTO) {
    const response = {
      id: dto.id,
      path: dto.path,
      name: dto.name,
      gameVersion: dto.gameVersion,
      screenshotPath: dto.screenshotPath,
      trechoCount: dto.trechoCount,
      lastOpenedAt: dto.lastOpenedAt.toISOString(),
      createdAt: dto.createdAt.toISOString(),
      updatedAt: dto.updatedAt.toISOString(),
    };

    return validateResponse(RecentProjectResponseSchema, response);
  }

  /**
   * Convert paginated result to HTTP response
   */
  static toPaginatedHttp(result: RecentProjectsSearchResultDTO) {
    const response = {
      data: result.items.map((item) => this.toHttp(item)),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        lastPage: result.lastPage,
      },
    };

    return validateResponse(RecentProjectsListResponseSchema, response);
  }

  /**
   * Convert success response
   */
  static toSuccess() {
    const response = { success: true };
    return validateResponse(SuccessResponseSchema, response);
  }
}
