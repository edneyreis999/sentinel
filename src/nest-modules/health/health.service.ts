import { Injectable } from '@nestjs/common';
import { HealthStatus, HealthStatusEnum } from './types/health-status.types';

@Injectable()
export class HealthService {
  private readonly startTime: Date = new Date();
  private readonly version: string;

  constructor() {
    // Try to get version from package.json
    try {
      const packageJson = require('../../../../package.json');
      this.version = packageJson.version || '1.0.0';
    } catch {
      this.version = '1.0.0';
    }
  }

  getStatus(): HealthStatus {
    const uptime = process.uptime();
    const now = new Date();

    // Simple health check logic
    let status: HealthStatusEnum = HealthStatusEnum.HEALTHY;

    // Check memory usage
    const usedMemory = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    const memoryUsagePercent = (usedMemory.heapUsed / totalMemory) * 100;

    if (memoryUsagePercent > 90) {
      status = HealthStatusEnum.UNHEALTHY;
    } else if (memoryUsagePercent > 75) {
      status = HealthStatusEnum.DEGRADED;
    }

    return {
      status,
      version: this.version,
      uptime,
      timestamp: now,
    };
  }
}
