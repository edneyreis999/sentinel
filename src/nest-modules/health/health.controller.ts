import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  uptime: number;
  services: {
    database: {
      status: 'up' | 'down';
      latency?: number;
    };
  };
}

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<HealthStatus> {
    const startTime = Date.now();
    let overallStatus: 'ok' | 'degraded' | 'down' = 'ok';
    let databaseStatus: 'up' | 'down' = 'down';
    let databaseLatency: number | undefined;

    try {
      // Simple query to check database connection
      await this.prisma.$queryRaw`SELECT 1`;
      databaseStatus = 'up';
      databaseLatency = Date.now() - startTime;
    } catch (error) {
      overallStatus = 'down';
      databaseStatus = 'down';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: {
          status: databaseStatus,
          latency: databaseLatency,
        },
      },
    };
  }
}
