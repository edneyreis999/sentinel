import { MemoryHealthIndicator } from '../indicators/memory-health.indicator';
import { HealthStatusEnum } from '../types/health-status.types';
import * as os from 'os';

describe('MemoryHealthIndicator', () => {
  let indicator: MemoryHealthIndicator;

  beforeEach(() => {
    indicator = new MemoryHealthIndicator();
  });

  describe('checkMemoryStatus', () => {
    it('should return HEALTHY when memory usage is below 80%', () => {
      // Mock to simulate low memory usage
      const totalMem = os.totalmem();
      const lowUsage = totalMem * 0.5; // 50% usage

      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: lowUsage,
        heapTotal: lowUsage,
        heapUsed: lowUsage * 0.8,
        external: 0,
        arrayBuffers: 0,
      });

      const status = indicator.checkMemoryStatus();

      expect(status).toBe(HealthStatusEnum.HEALTHY);
    });

    it('should return DEGRADED when memory usage is between 80% and 95%', () => {
      const totalMem = os.totalmem();
      const degradedUsage = totalMem * 0.85; // 85% usage

      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: degradedUsage,
        heapTotal: degradedUsage,
        heapUsed: degradedUsage * 0.8,
        external: 0,
        arrayBuffers: 0,
      });

      const status = indicator.checkMemoryStatus();

      expect(status).toBe(HealthStatusEnum.DEGRADED);
    });

    it('should return UNHEALTHY when memory usage is 95% or above', () => {
      const totalMem = os.totalmem();
      const unhealthyUsage = totalMem * 0.96; // 96% usage

      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: unhealthyUsage,
        heapTotal: unhealthyUsage,
        heapUsed: unhealthyUsage * 0.8,
        external: 0,
        arrayBuffers: 0,
      });

      const status = indicator.checkMemoryStatus();

      expect(status).toBe(HealthStatusEnum.UNHEALTHY);
    });

    it('should return DEGRADED exactly at 80% threshold', () => {
      const totalMem = os.totalmem();
      const thresholdUsage = totalMem * 0.8;

      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: thresholdUsage,
        heapTotal: thresholdUsage,
        heapUsed: thresholdUsage * 0.8,
        external: 0,
        arrayBuffers: 0,
      });

      const status = indicator.checkMemoryStatus();

      expect(status).toBe(HealthStatusEnum.DEGRADED);
    });

    it('should return UNHEALTHY exactly at 95% threshold', () => {
      // Mock totalmem to ensure consistent calculation
      const totalMem = 16_000_000_000; // 16GB fixed value
      jest.spyOn(os, 'totalmem').mockReturnValue(totalMem);

      const thresholdUsage = totalMem * 0.95;

      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: thresholdUsage,
        heapTotal: thresholdUsage,
        heapUsed: thresholdUsage * 0.8,
        external: 0,
        arrayBuffers: 0,
      });

      const status = indicator.checkMemoryStatus();

      expect(status).toBe(HealthStatusEnum.UNHEALTHY);
    });
  });

  describe('getMemoryUsagePercent', () => {
    it('should return memory usage as percentage', () => {
      const totalMem = os.totalmem();
      const currentUsage = totalMem * 0.5; // 50% usage

      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: currentUsage,
        heapTotal: currentUsage,
        heapUsed: currentUsage * 0.8,
        external: 0,
        arrayBuffers: 0,
      });

      const percent = indicator.getMemoryUsagePercent();

      expect(percent).toBeCloseTo(50, 1);
    });

    it('should return a value between 0 and 100', () => {
      const percent = indicator.getMemoryUsagePercent();

      expect(percent).toBeGreaterThanOrEqual(0);
      expect(percent).toBeLessThanOrEqual(100);
    });
  });
});
