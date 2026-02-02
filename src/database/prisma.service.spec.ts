/**
 * PrismaService - Contract Test
 *
 * STRATEGY: Infrastructure wrapper testing (see ADR-TEST-002)
 *
 * This test validates ONLY the public interface contract, not implementation.
 * PrismaService extends PrismaClient (Prisma 7+ pattern) with lifecycle hooks.
 *
 * INTEGRATION TESTS: Real database testing should happen at Repository layer,
 * not here. See PrismaProjectRepository.spec.ts for examples.
 */

import { PrismaService } from './prisma.service';

describe('PrismaService - Contract', () => {
  let service: PrismaService;

  beforeAll(() => {
    // Suppress connection errors during contract validation
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
  });

  beforeEach(() => {
    service = new PrismaService();
  });

  describe('Prisma Client Extension', () => {
    it('should expose all required Prisma models', () => {
      // PrismaService extends PrismaClient, so models are inherited
      expect(service.recentProject).toBeDefined();
      expect(service.userPreferences).toBeDefined();
      expect(service.simulationHistoryEntry).toBeDefined();
    });

    it('should inherit PrismaClient lifecycle methods', () => {
      expect(service.$connect).toBeInstanceOf(Function);
      expect(service.$disconnect).toBeInstanceOf(Function);
      expect(service.$transaction).toBeInstanceOf(Function);
    });
  });

  describe('Interface Contract', () => {
    it('should be compatible with NestJS dependency injection', () => {
      // Validates that service can be instantiated without parameters
      // (required for @Injectable() decorator)
      expect(() => new PrismaService()).not.toThrow();
    });

    it('should implement required lifecycle hooks', () => {
      expect(service.onModuleInit).toBeInstanceOf(Function);
      expect(service.onModuleDestroy).toBeInstanceOf(Function);
    });
  });
});
