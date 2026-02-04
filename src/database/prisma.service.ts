import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['error', 'warn'],
    });
  }

  async onModuleInit() {
    this.logger.log('Connecting to Prisma...');
    try {
      await this.$connect();
      await this.$queryRaw`SELECT 1`;
      this.logger.log('PostgreSQL database connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to PostgreSQL', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('PostgreSQL database disconnected');
  }

  /**
   * Clean all tables - useful for testing
   * WARNING: This will delete all data!
   */
  async cleanDatabase() {
    await this.simulationHistoryEntry.deleteMany();
    await this.userPreferences.deleteMany();
    await this.recentProject.deleteMany();
  }
}
