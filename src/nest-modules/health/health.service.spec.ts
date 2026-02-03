import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { HealthStatusEnum } from './types/health-status.types';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthService],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStatus', () => {
    it('should return health status with all required fields', () => {
      const result = service.getStatus();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('timestamp');
    });

    it('should return a valid version string', () => {
      const result = service.getStatus();

      expect(result.version).toBeDefined();
      expect(typeof result.version).toBe('string');
      expect(result.version.length).toBeGreaterThan(0);
    });

    it('should return uptime as a positive number', () => {
      const result = service.getStatus();

      expect(result.uptime).toBeDefined();
      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return a valid timestamp', () => {
      const result = service.getStatus();
      const now = new Date();

      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(now.getTime());
      expect(result.timestamp.getTime()).toBeGreaterThan(
        now.getTime() - 1000, // Within last second
      );
    });

    it('should return HEALTHY status by default', () => {
      // Mock process.memoryUsage to return low memory usage
      const originalMemoryUsage = process.memoryUsage;
      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        heapUsed: 100 * 1024 * 1024, // 100MB
        heapTotal: 200 * 1024 * 1024,
        rss: 200 * 1024 * 1024,
        arrayBuffers: 0,
        external: 0,
      });

      const result = service.getStatus();

      expect(result.status).toBe(HealthStatusEnum.HEALTHY);

      process.memoryUsage = originalMemoryUsage;
    });

    it('should return DEGRADED status when memory usage is high', () => {
      const os = require('os');
      const totalMemory = os.totalmem();
      const degradedMemoryThreshold = totalMemory * 0.8; // 80% usage

      const originalMemoryUsage = process.memoryUsage;
      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        heapUsed: degradedMemoryThreshold,
        heapTotal: degradedMemoryThreshold * 2,
        rss: degradedMemoryThreshold * 2,
        arrayBuffers: 0,
        external: 0,
      });

      const result = service.getStatus();

      expect(result.status).toBe(HealthStatusEnum.DEGRADED);

      process.memoryUsage = originalMemoryUsage;
    });

    it('should return UNHEALTHY status when memory usage is critical', () => {
      const os = require('os');
      const totalMemory = os.totalmem();
      const unhealthyMemoryThreshold = totalMemory * 0.95; // 95% usage

      const originalMemoryUsage = process.memoryUsage;
      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        heapUsed: unhealthyMemoryThreshold,
        heapTotal: unhealthyMemoryThreshold * 2,
        rss: unhealthyMemoryThreshold * 2,
        arrayBuffers: 0,
        external: 0,
      });

      const result = service.getStatus();

      expect(result.status).toBe(HealthStatusEnum.UNHEALTHY);

      process.memoryUsage = originalMemoryUsage;
    });

    it('should return consistent version across multiple calls', () => {
      const result1 = service.getStatus();
      const result2 = service.getStatus();

      expect(result1.version).toBe(result2.version);
    });

    it('should return increasing uptime', async () => {
      const result1 = service.getStatus();
      await new Promise((resolve) => setTimeout(resolve, 100));
      const result2 = service.getStatus();

      expect(result2.uptime).toBeGreaterThan(result1.uptime);
    });
  });
});
