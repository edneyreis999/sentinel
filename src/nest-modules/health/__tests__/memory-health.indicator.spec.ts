import { MemoryHealthIndicator } from '../indicators/memory-health.indicator';
import { HealthStatusEnum } from '../types/health-status.types';
import * as os from 'os';

// Test constants for memory usage scenarios
const MEMORY_USAGE_SCENARIOS = {
  HEALTHY: { percent: 0.5, expectedStatus: HealthStatusEnum.HEALTHY },
  DEGRADED: { percent: 0.85, expectedStatus: HealthStatusEnum.DEGRADED },
  UNHEALTHY: { percent: 0.96, expectedStatus: HealthStatusEnum.UNHEALTHY },
  THRESHOLD_80: { percent: 0.8, expectedStatus: HealthStatusEnum.DEGRADED },
  THRESHOLD_95: { percent: 0.95, expectedStatus: HealthStatusEnum.UNHEALTHY },
} as const;

// System constants for testing
const SYSTEM_CONSTANTS = {
  MOCK_TOTAL_MEMORY_16GB: 16_000_000_000, // 16GB in bytes for consistent calculation
} as const;

describe('MemoryHealthIndicator', () => {
  let indicator: MemoryHealthIndicator;

  beforeEach(() => {
    indicator = new MemoryHealthIndicator();
  });

  describe('checkMemoryStatus', () => {
    it('should return HEALTHY when memory usage is below 80%', () => {
      const totalMem = os.totalmem();
      const usage = totalMem * MEMORY_USAGE_SCENARIOS.HEALTHY.percent;

      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: usage,
        heapTotal: usage,
        heapUsed: usage * 0.8,
        external: 0,
        arrayBuffers: 0,
      });

      const status = indicator.checkMemoryStatus();

      expect(status).toBe(MEMORY_USAGE_SCENARIOS.HEALTHY.expectedStatus);
    });

    it('should return DEGRADED when memory usage is between 80% and 95%', () => {
      const totalMem = os.totalmem();
      const usage = totalMem * MEMORY_USAGE_SCENARIOS.DEGRADED.percent;

      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: usage,
        heapTotal: usage,
        heapUsed: usage * 0.8,
        external: 0,
        arrayBuffers: 0,
      });

      const status = indicator.checkMemoryStatus();

      expect(status).toBe(MEMORY_USAGE_SCENARIOS.DEGRADED.expectedStatus);
    });

    it('should return UNHEALTHY when memory usage is 95% or above', () => {
      const totalMem = os.totalmem();
      const usage = totalMem * MEMORY_USAGE_SCENARIOS.UNHEALTHY.percent;

      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: usage,
        heapTotal: usage,
        heapUsed: usage * 0.8,
        external: 0,
        arrayBuffers: 0,
      });

      const status = indicator.checkMemoryStatus();

      expect(status).toBe(MEMORY_USAGE_SCENARIOS.UNHEALTHY.expectedStatus);
    });

    it('should return DEGRADED exactly at 80% threshold', () => {
      const totalMem = os.totalmem();
      const usage = totalMem * MEMORY_USAGE_SCENARIOS.THRESHOLD_80.percent;

      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: usage,
        heapTotal: usage,
        heapUsed: usage * 0.8,
        external: 0,
        arrayBuffers: 0,
      });

      const status = indicator.checkMemoryStatus();

      expect(status).toBe(MEMORY_USAGE_SCENARIOS.THRESHOLD_80.expectedStatus);
    });

    it('should return UNHEALTHY exactly at 95% threshold', () => {
      const totalMem = SYSTEM_CONSTANTS.MOCK_TOTAL_MEMORY_16GB;
      jest.spyOn(os, 'totalmem').mockReturnValue(totalMem);

      const usage = totalMem * MEMORY_USAGE_SCENARIOS.THRESHOLD_95.percent;

      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: usage,
        heapTotal: usage,
        heapUsed: usage * 0.8,
        external: 0,
        arrayBuffers: 0,
      });

      const status = indicator.checkMemoryStatus();

      expect(status).toBe(MEMORY_USAGE_SCENARIOS.THRESHOLD_95.expectedStatus);
    });
  });

  describe('getMemoryUsagePercent', () => {
    it('should return memory usage as percentage', () => {
      const totalMem = os.totalmem();
      const currentUsage = totalMem * MEMORY_USAGE_SCENARIOS.HEALTHY.percent;

      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: currentUsage,
        heapTotal: currentUsage,
        heapUsed: currentUsage * 0.8,
        external: 0,
        arrayBuffers: 0,
      });

      const percent = indicator.getMemoryUsagePercent();

      expect(percent).toBeCloseTo(MEMORY_USAGE_SCENARIOS.HEALTHY.percent * 100, 1);
    });

    it('should return a value between 0 and 100', () => {
      const percent = indicator.getMemoryUsagePercent();

      expect(percent).toBeGreaterThanOrEqual(0);
      expect(percent).toBeLessThanOrEqual(100);
    });
  });
});
