import { RecentProject } from '../../../domain/recent-project.aggregate';

/**
 * Output DTO for RecentProject
 *
 * Contains data transferred from use cases to presenters/controllers.
 * Factory methods convert from domain aggregates to DTOs.
 */
export class RecentProjectOutputDTO {
  readonly id!: string;
  readonly path!: string;
  readonly name!: string;
  readonly gameVersion!: string | null;
  readonly screenshotPath!: string | null;
  readonly trechoCount!: number | null;
  readonly lastOpenedAt!: Date;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;

  private constructor(data: RecentProjectOutputDTO) {
    Object.assign(this, data);
  }

  /**
   * Factory Method: Convert aggregate to DTO
   * Centralizes conversion and isolates domain from output layer
   */
  static fromDomain(aggregate: RecentProject): RecentProjectOutputDTO {
    return new RecentProjectOutputDTO({
      id: aggregate.id,
      path: aggregate.path,
      name: aggregate.name,
      gameVersion: aggregate.gameVersion,
      screenshotPath: aggregate.screenshotPath,
      trechoCount: aggregate.trechoCount,
      lastOpenedAt: aggregate.lastOpenedAt,
      createdAt: aggregate.createdAt,
      updatedAt: aggregate.updatedAt,
    });
  }

  /**
   * Factory Method: Convert array of aggregates to array of DTOs
   */
  static fromDomainArray(aggregates: RecentProject[]): RecentProjectOutputDTO[] {
    return aggregates.map((agg) => RecentProjectOutputDTO.fromDomain(agg));
  }
}
