import { MemoryHealthIndicator } from '../../indicators/memory-health.indicator';
import { HealthStatusEnum } from '../../types/health-status.types';

/**
 * Fake implementation of MemoryHealthIndicator for testing.
 * Allows controlling memory status and usage percentage for deterministic tests.
 */
export class FakeMemoryHealthIndicator extends MemoryHealthIndicator {
  private forcedStatus?: HealthStatusEnum;
  private forcedUsagePercent?: number;

  /**
   * Force a specific health status to be returned by checkMemoryStatus()
   */
  forceStatus(status: HealthStatusEnum): void {
    this.forcedStatus = status;
  }

  /**
   * Force a specific memory usage percentage to be returned by getMemoryUsagePercent()
   */
  forceUsagePercent(percent: number): void {
    this.forcedUsagePercent = percent;
  }

  /**
   * Reset to default behavior (no forced values)
   */
  reset(): void {
    this.forcedStatus = undefined;
    this.forcedUsagePercent = undefined;
  }

  override checkMemoryStatus(): HealthStatusEnum {
    return this.forcedStatus ?? HealthStatusEnum.HEALTHY;
  }

  override getMemoryUsagePercent(): number {
    if (this.forcedUsagePercent !== undefined) {
      return this.forcedUsagePercent;
    }

    // Default behavior based on forced status
    switch (this.forcedStatus) {
      case HealthStatusEnum.UNHEALTHY:
        return 96;
      case HealthStatusEnum.DEGRADED:
        return 85;
      case HealthStatusEnum.HEALTHY:
      default:
        return 50;
    }
  }
}
