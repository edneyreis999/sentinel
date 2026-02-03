import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from '../health.service';
import { MemoryHealthIndicator } from '../indicators/memory-health.indicator';
import { HealthStatusEnum } from '../types/health-status.types';
import { FakeMemoryHealthIndicator } from './fakes/fake-memory-health.indicator';

describe('HealthService', () => {
  let service: HealthService;
  let memoryIndicator: FakeMemoryHealthIndicator;

  beforeEach(async () => {
    memoryIndicator = new FakeMemoryHealthIndicator();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: MemoryHealthIndicator,
          useValue: memoryIndicator,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  afterEach(() => {
    memoryIndicator.reset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStatus', () => {
    it('should return health status with all required fields', () => {
      memoryIndicator.forceStatus(HealthStatusEnum.HEALTHY);

      const result = service.getStatus();

      expect(result).toMatchObject({
        status: expect.any(String),
        version: expect.any(String),
        uptime: expect.any(Number),
        timestamp: expect.any(Date),
      });
    });

    it('should return a valid version string', () => {
      memoryIndicator.forceStatus(HealthStatusEnum.HEALTHY);

      const result = service.getStatus();

      expect(result.version).toBeDefined();
      expect(typeof result.version).toBe('string');
      expect(result.version.length).toBeGreaterThan(0);
    });

    it('should return uptime as a positive number', () => {
      memoryIndicator.forceStatus(HealthStatusEnum.HEALTHY);

      const result = service.getStatus();

      expect(result.uptime).toBeDefined();
      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return a valid timestamp', () => {
      memoryIndicator.forceStatus(HealthStatusEnum.HEALTHY);

      const result = service.getStatus();
      const now = new Date();

      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(now.getTime());
      expect(result.timestamp.getTime()).toBeGreaterThan(now.getTime() - 1000);
    });

    it.each([HealthStatusEnum.HEALTHY, HealthStatusEnum.DEGRADED, HealthStatusEnum.UNHEALTHY])(
      'should propagate %s status from memory indicator',
      (status) => {
        memoryIndicator.forceStatus(status);

        const result = service.getStatus();

        expect(result.status).toBe(status);
      },
    );

    it('should return consistent version across multiple calls', () => {
      memoryIndicator.forceStatus(HealthStatusEnum.HEALTHY);

      const result1 = service.getStatus();
      const result2 = service.getStatus();

      expect(result1.version).toBe(result2.version);
    });

    it('should return increasing uptime', async () => {
      memoryIndicator.forceStatus(HealthStatusEnum.HEALTHY);

      const result1 = service.getStatus();
      await new Promise((resolve) => setTimeout(resolve, 100));
      const result2 = service.getStatus();

      expect(result2.uptime).toBeGreaterThan(result1.uptime);
    });
  });
});
