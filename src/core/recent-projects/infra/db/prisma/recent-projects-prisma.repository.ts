import { Injectable } from '@nestjs/common';
import {
  IRecentProjectsRepository,
  RecentProjectSearchParams,
  RecentProjectSearchResult,
} from '@core/recent-projects/domain';
import { RecentProject } from '@core/recent-projects/domain';
import { RecentProjectMapper } from './mappers/recent-project.mapper';
import { PrismaService } from '@database';
import { Prisma } from '@prisma/client';

/**
 * Prisma implementation of RecentProjects Repository
 *
 * This repository handles persistence using Prisma ORM.
 * It converts between Prisma models and Domain aggregates using the Mapper.
 */
@Injectable()
export class RecentProjectsPrismaRepository implements IRecentProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async insert(project: RecentProject): Promise<void> {
    const data = RecentProjectMapper.toPersistence(project);

    await this.prisma.recentProject.create({
      data: {
        id: project.id,
        ...data,
      },
    });
  }

  async update(project: RecentProject): Promise<void> {
    const data = RecentProjectMapper.toPersistence(project);

    await this.prisma.recentProject.update({
      where: { path: project.path },
      data,
    });
  }

  async upsert(project: RecentProject): Promise<void> {
    const data = RecentProjectMapper.toPersistence(project);

    await this.prisma.recentProject.upsert({
      where: { path: project.path },
      update: {
        name: data.name,
        gameVersion: data.gameVersion,
        screenshotPath: data.screenshotPath,
        trechoCount: data.trechoCount,
        lastOpenedAt: project.lastOpenedAt,
        updatedAt: project.updatedAt,
      },
      create: {
        id: project.id,
        ...data,
      },
    });
  }

  async findByPath(path: string): Promise<RecentProject | null> {
    const record = await this.prisma.recentProject.findUnique({
      where: { path },
    });

    return record ? RecentProjectMapper.toDomain(record) : null;
  }

  async findById(id: string): Promise<RecentProject | null> {
    const record = await this.prisma.recentProject.findUnique({
      where: { id },
    });

    return record ? RecentProjectMapper.toDomain(record) : null;
  }

  async search(params: RecentProjectSearchParams): Promise<RecentProjectSearchResult> {
    const limit = params.limit ?? 10;
    const offset = params.offset ?? 0;

    // Build where clause
    const where: Prisma.RecentProjectWhereInput = {};

    if (params.nameFilter) {
      // SQLite doesn't support case-insensitive mode, use contains only
      where.name = {
        contains: params.nameFilter,
      };
    }

    if (params.gameVersion) {
      where.gameVersion = params.gameVersion;
    }

    // Execute queries in parallel
    const [items, total] = await Promise.all([
      this.prisma.recentProject.findMany({
        where,
        orderBy: { lastOpenedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.recentProject.count({ where }),
    ]);

    const page = Math.floor(offset / limit) + 1;
    const lastPage = Math.ceil(total / limit);

    return {
      items: RecentProjectMapper.toDomainArray(items),
      total,
      page,
      perPage: limit,
      lastPage,
    };
  }

  async delete(path: string): Promise<void> {
    await this.prisma.recentProject.delete({
      where: { path },
    });
  }

  async count(filters?: Partial<RecentProjectSearchParams>): Promise<number> {
    const where: Prisma.RecentProjectWhereInput = {};

    if (filters?.nameFilter) {
      // SQLite doesn't support case-insensitive mode, use contains only
      where.name = {
        contains: filters.nameFilter,
      };
    }

    if (filters?.gameVersion) {
      where.gameVersion = filters.gameVersion;
    }

    return this.prisma.recentProject.count({ where });
  }

  async existsByPath(path: string): Promise<boolean> {
    const count = await this.prisma.recentProject.count({
      where: { path },
    });

    return count > 0;
  }
}
