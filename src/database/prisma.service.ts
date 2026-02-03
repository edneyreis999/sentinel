import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool, PoolConfig } from 'pg';

/**
 * PrismaService - Prisma 7 + PostgreSQL + NestJS Integration
 *
 * Using explicit Pool with connectionString (Solução 2 + 5 from troubleshooting)
 *
 * @see https://www.prisma.io/docs/orm/overview/databases/postgresql
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor() {
    const poolConfig: PoolConfig = {
      connectionString: process.env.DATABASE_URL,
    };

    const pool = new Pool(poolConfig);

    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: ['error', 'warn'],
    });

    this.pool = pool;

    // Pool event handlers for debugging
    this.pool.on('connect', () => {
      this.logger.log('✅ PostgreSQL pool client connected');
    });

    this.pool.on('error', (err) => {
      this.logger.error('❌ PostgreSQL pool error:', err);
    });
  }

  async onModuleInit() {
    this.logger.log('🔌 Connecting to Prisma...');
    this.logger.log(`DATABASE_URL: ${process.env.DATABASE_URL}`);
    try {
      await this.$connect();
      // Verify connection with a simple query
      await this.$queryRaw`SELECT 1`;
      this.logger.log('✅ PostgreSQL database connected successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect to PostgreSQL', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('PostgreSQL database disconnected');
  }

  /**
   * Clean all tables - useful for testing
   * WARNING: This will delete all data!
   */
  async cleanDatabase() {
    // Delete in order to respect foreign key constraints
    await this.simulationHistoryEntry.deleteMany();
    await this.userPreferences.deleteMany();
    await this.recentProject.deleteMany();
  }
}
