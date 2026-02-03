import { Injectable } from '@nestjs/common';
import * as os from 'os';
import { HealthStatusEnum } from '../types/health-status.types';

/**
 * Injectable service to check memory health status
 * Separates memory calculation logic for better testability
 */
@Injectable()
export class MemoryHealthIndicator {
  private readonly UNHEALTHY_THRESHOLD = 0.95; // 95%
  private readonly DEGRADED_THRESHOLD = 0.8; // 80%

  checkMemoryStatus(): HealthStatusEnum {
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const usagePercent = memUsage.rss / totalMem;

    if (usagePercent >= this.UNHEALTHY_THRESHOLD) {
      return HealthStatusEnum.UNHEALTHY;
    }

    if (usagePercent >= this.DEGRADED_THRESHOLD) {
      return HealthStatusEnum.DEGRADED;
    }

    return HealthStatusEnum.HEALTHY;
  }

  getMemoryUsagePercent(): number {
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    return (memUsage.rss / totalMem) * 100;
  }
}
