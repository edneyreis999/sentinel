import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * PrismaService - Official Prisma 7 + NestJS Integration
 *
 * This service extends PrismaClient directly (Prisma 7+ pattern)
 * instead of delegating to it. The generated client is imported from
 * src/generated/prisma using a relative path.
 *
 * Lifecycle hooks ensure proper connection management:
 * - onModuleInit: Connects to database
 * - onModuleDestroy: Disconnects gracefully
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });

    super({
      adapter,
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }
}
