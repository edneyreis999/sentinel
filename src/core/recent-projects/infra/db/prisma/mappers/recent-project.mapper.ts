import { RecentProject } from '../../../../domain/recent-project.aggregate';
import { RecentProject as PrismaRecentProject } from '@prisma/client';

export class RecentProjectMapper {
  /**
   * Convert Prisma model to Domain aggregate
   */
  static toDomain(prisma: PrismaRecentProject): RecentProject {
    return RecentProject.fromPersistence({
      id: prisma.id,
      path: prisma.path,
      name: prisma.name,
      gameVersion: prisma.gameVersion,
      screenshotPath: prisma.screenshotPath,
      trechoCount: prisma.trechoCount,
      lastOpenedAt: prisma.lastOpenedAt,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    });
  }

  /**
   * Convert Domain aggregate to Prisma model for persistence
   */
  static toPersistence(project: RecentProject): Omit<PrismaRecentProject, 'id'> {
    return {
      path: project.path,
      name: project.name,
      gameVersion: project.gameVersion,
      screenshotPath: project.screenshotPath,
      trechoCount: project.trechoCount,
      lastOpenedAt: project.lastOpenedAt,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  /**
   * Convert array of Prisma models to Domain aggregates
   */
  static toDomainArray(prismas: PrismaRecentProject[]): RecentProject[] {
    return prismas.map((p) => RecentProjectMapper.toDomain(p));
  }
}
