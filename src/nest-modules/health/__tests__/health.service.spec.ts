import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from '../health.service';
import { MemoryHealthIndicator } from '../indicators/memory-health.indicator';
import { HealthStatusEnum } from '../types/health-status.types';

describe('HealthService', () => {
  let service: HealthService;
  let memoryIndicator: jest.Mocked<MemoryHealthIndicator>;

  beforeEach(async () => {
    // Create mock for MemoryHealthIndicator
    const mockMemoryIndicator = {
      checkMemoryStatus: jest.fn(),
      getMemoryUsagePercent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: MemoryHealthIndicator,
          useValue: mockMemoryIndicator,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    memoryIndicator = module.get(MemoryHealthIndicator);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStatus', () => {
    it('should return health status with all required fields', () => {
      memoryIndicator.checkMemoryStatus.mockReturnValue(HealthStatusEnum.HEALTHY);

      const result = service.getStatus();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('timestamp');
    });

    it('should return a valid version string', () => {
      memoryIndicator.checkMemoryStatus.mockReturnValue(HealthStatusEnum.HEALTHY);

      const result = service.getStatus();

      expect(result.version).toBeDefined();
      expect(typeof result.version).toBe('string');
      expect(result.version.length).toBeGreaterThan(0);
    });

    it('should return uptime as a positive number', () => {
      memoryIndicator.checkMemoryStatus.mockReturnValue(HealthStatusEnum.HEALTHY);

      const result = service.getStatus();

      expect(result.uptime).toBeDefined();
      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return a valid timestamp', () => {
      memoryIndicator.checkMemoryStatus.mockReturnValue(HealthStatusEnum.HEALTHY);

      const result = service.getStatus();
      const now = new Date();

      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(now.getTime());
      expect(result.timestamp.getTime()).toBeGreaterThan(now.getTime() - 1000);
    });

    it('should return HEALTHY status from memory indicator', () => {
      memoryIndicator.checkMemoryStatus.mockReturnValue(HealthStatusEnum.HEALTHY);

      const result = service.getStatus();

      expect(result.status).toBe(HealthStatusEnum.HEALTHY);
      expect(memoryIndicator.checkMemoryStatus).toHaveBeenCalled();
    });

    it('should return DEGRADED status from memory indicator', () => {
      memoryIndicator.checkMemoryStatus.mockReturnValue(HealthStatusEnum.DEGRADED);

      const result = service.getStatus();

      expect(result.status).toBe(HealthStatusEnum.DEGRADED);
      expect(memoryIndicator.checkMemoryStatus).toHaveBeenCalled();
    });

    it('should return UNHEALTHY status from memory indicator', () => {
      memoryIndicator.checkMemoryStatus.mockReturnValue(HealthStatusEnum.UNHEALTHY);

      const result = service.getStatus();

      expect(result.status).toBe(HealthStatusEnum.UNHEALTHY);
      expect(memoryIndicator.checkMemoryStatus).toHaveBeenCalled();
    });

    it('should return consistent version across multiple calls', () => {
      memoryIndicator.checkMemoryStatus.mockReturnValue(HealthStatusEnum.HEALTHY);

      const result1 = service.getStatus();
      const result2 = service.getStatus();

      expect(result1.version).toBe(result2.version);
    });

    it('should return increasing uptime', async () => {
      memoryIndicator.checkMemoryStatus.mockReturnValue(HealthStatusEnum.HEALTHY);

      const result1 = service.getStatus();
      await new Promise((resolve) => setTimeout(resolve, 100));
      const result2 = service.getStatus();

      expect(result2.uptime).toBeGreaterThan(result1.uptime);
    });
  });
});
