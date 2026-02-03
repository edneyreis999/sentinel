import { Injectable } from '@nestjs/common';
import { HealthStatus } from './types/health-status.types';
import { MemoryHealthIndicator } from './indicators/memory-health.indicator';

@Injectable()
export class HealthService {
  private readonly startTime: Date = new Date();
  private readonly version: string;

  constructor(private readonly memoryIndicator: MemoryHealthIndicator) {
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
    const status = this.memoryIndicator.checkMemoryStatus();

    return {
      status,
      version: this.version,
      uptime,
      timestamp: now,
    };
  }
}
