import { PrismaService } from '@database';
import {
  ISimulationHistoryRepository,
  SimulationHistoryFilters,
  PaginationParams,
  SimulationHistorySearchResult,
  SimulationHistoryEntry,
  CreateSimulationHistoryEntryProps,
} from '../../../domain';
import { SimulationStatus } from '../../../domain/value-objects';

/**
 * SimulationHistoryPrismaRepository
 *
 * Prisma implementation of the ISimulationHistoryRepository interface.
 * Maps between Prisma models and domain entities.
 *
 * This class is in the Infrastructure Layer and can depend on Prisma.
 */
export class SimulationHistoryPrismaRepository implements ISimulationHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<SimulationHistoryEntry | null> {
    const model = await this.prisma.simulationHistoryEntry.findUnique({
      where: { id },
    });

    if (!model) {
      return null;
    }

    return this.toDomain(model);
  }

  async search(
    filters: SimulationHistoryFilters,
    pagination: PaginationParams,
  ): Promise<SimulationHistorySearchResult> {
    const { page = 1, perPage = 20 } = pagination;

    // Build dynamic WHERE clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma dynamic where clause
    const where: Record<string, any> = {};

    if (filters.projectPath) {
      where.projectPath = {
        contains: filters.projectPath,
        mode: 'insensitive',
      };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.ttkVersion) {
      where.ttkVersion = filters.ttkVersion;
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      where.timestamp = {};
      if (filters.dateFrom) {
        where.timestamp.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.timestamp.lte = filters.dateTo;
      }
    }

    // Execute queries in parallel
    const [items, total] = await Promise.all([
      this.prisma.simulationHistoryEntry.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: perPage,
        skip: (page - 1) * perPage,
      }),
      this.prisma.simulationHistoryEntry.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toDomain(item)),
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
    const model = this.toModel(entry);

    await this.prisma.simulationHistoryEntry.create({
      data: model,
    });
  }

  async update(entry: SimulationHistoryEntry): Promise<void> {
    const model = this.toModel(entry);

    await this.prisma.simulationHistoryEntry.update({
      where: { id: entry.id },
      data: model,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.simulationHistoryEntry.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.simulationHistoryEntry.count({
      where: { id },
    });

    return count > 0;
  }

  /**
   * Maps Prisma model to Domain entity
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma model mapping
  private toDomain(model: Record<string, any>): SimulationHistoryEntry {
    const props: CreateSimulationHistoryEntryProps = {
      id: model.id,
      projectPath: model.projectPath,
      projectName: model.projectName,
      status: this.parseStatus(model.status),
      ttkVersion: model.ttkVersion,
      configJson: model.configJson,
      summaryJson: model.summaryJson,
      hasReport: model.hasReport,
      reportFilePath: model.reportFilePath ?? undefined,
      durationMs: model.durationMs,
      battleCount: model.battleCount,
      trechoCount: model.trechoCount,
      timestamp: model.timestamp,
    };

    return SimulationHistoryEntry.create(props);
  }

  /**
   * Maps Domain entity to Prisma model
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma model mapping
  private toModel(entry: SimulationHistoryEntry): Record<string, any> {
    return {
      id: entry.id,
      projectPath: entry.projectPath,
      projectName: entry.projectName,
      status: entry.status,
      ttkVersion: entry.ttkVersion,
      configJson: entry.configJson,
      summaryJson: entry.summaryJson,
      hasReport: entry.hasReport,
      reportFilePath: entry.reportFilePath ?? null,
      durationMs: entry.durationMs,
      battleCount: entry.battleCount,
      trechoCount: entry.trechoCount,
      timestamp: entry.timestamp,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }

  /**
   * Parses status string to enum
   */
  private parseStatus(status: string): SimulationStatus {
    const validStatuses = Object.values(SimulationStatus);
    if (validStatuses.includes(status as SimulationStatus)) {
      return status as SimulationStatus;
    }
    return SimulationStatus.PENDING;
  }
}
