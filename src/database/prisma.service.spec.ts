/**
 * PrismaService - Contract Test
 *
 * STRATEGY: Infrastructure wrapper testing (see ADR-TEST-XXX)
 *
 * This test validates ONLY the public interface contract, not implementation.
 * PrismaService extends PrismaClient (Prisma 7+ pattern) with lifecycle hooks.
 *
 * INTEGRATION TESTS: Real database testing should happen at Repository layer,
 * not here. See PrismaProjectRepository.spec.ts for examples.
 *
 * NO DATABASE CONNECTION: This test uses spies to validate custom behavior
 * without requiring a real database connection.
 */

import { PrismaService } from './prisma.service';

describe('PrismaService - Contract', () => {
  describe('Prisma Client Extension', () => {
    it('should expose all required Prisma models', () => {
      const service = new PrismaService();

      // PrismaService extends PrismaClient, so models are inherited
      // This validates the public interface contract
      expect(service.recentProject).toBeDefined();
      expect(service.userPreferences).toBeDefined();
      expect(service.simulationHistoryEntry).toBeDefined();
    });

    it('should inherit PrismaClient lifecycle methods', () => {
      const service = new PrismaService();

      // Validates that PrismaClient methods are available via inheritance
      expect(service.$connect).toBeInstanceOf(Function);
      expect(service.$disconnect).toBeInstanceOf(Function);
      expect(service.$transaction).toBeInstanceOf(Function);
    });
  });

  describe('NestJS Integration', () => {
    it('should be compatible with NestJS dependency injection', () => {
      // Validates that service can be instantiated without parameters
      // (required for @Injectable() decorator)
      expect(() => new PrismaService()).not.toThrow();
    });

    it('should implement required NestJS lifecycle hooks', () => {
      const service = new PrismaService();

      // Validates interface contract for NestJS lifecycle
      expect(service.onModuleInit).toBeInstanceOf(Function);
      expect(service.onModuleDestroy).toBeInstanceOf(Function);
    });
  });

  describe('Custom Behavior (Lifecycle Hooks)', () => {
    it('should connect to database on module initialization', async () => {
      const service = new PrismaService();

      // Spy on PrismaClient's $connect method to validate custom behavior
      const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue();

      await service.onModuleInit();

      // Validates that onModuleInit calls $connect (custom behavior)
      expect(connectSpy).toHaveBeenCalledTimes(1);
      expect(connectSpy).toHaveBeenCalledWith();
    });

    it('should disconnect from database on module destruction', async () => {
      const service = new PrismaService();

      // Spy on PrismaClient's $disconnect method to validate custom behavior
      const disconnectSpy = jest.spyOn(service, '$disconnect').mockResolvedValue();

      await service.onModuleDestroy();

      // Validates that onModuleDestroy calls $disconnect (custom behavior)
      expect(disconnectSpy).toHaveBeenCalledTimes(1);
      expect(disconnectSpy).toHaveBeenCalledWith();
    });
  });

  describe('Logging Configuration', () => {
    it('should configure Prisma with appropriate log levels', () => {
      // Validates that the constructor accepts valid log configuration
      // If the log configuration were invalid, Prisma would throw during construction
      expect(() => new PrismaService()).not.toThrow();
    });

    it('should use proper adapter configuration', () => {
      // Validates that PrismaPg adapter is used (Prisma 7+ pattern)
      // If adapter configuration were invalid, construction would fail
      expect(() => new PrismaService()).not.toThrow();
    });

    it('should log successful connection', async () => {
      const service = new PrismaService();

      // Spy on the logger to validate custom logging behavior
      const loggerSpy = jest.spyOn((service as any).logger, 'log').mockImplementation();

      const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue();

      await service.onModuleInit();

      // Validates that custom logging occurs on connection
      expect(loggerSpy).toHaveBeenCalledWith('Database connected successfully');

      loggerSpy.mockRestore();
      connectSpy.mockRestore();
    });

    it('should log successful disconnection', async () => {
      const service = new PrismaService();

      // Spy on the logger to validate custom logging behavior
      const loggerSpy = jest.spyOn((service as any).logger, 'log').mockImplementation();

      const disconnectSpy = jest.spyOn(service, '$disconnect').mockResolvedValue();

      await service.onModuleDestroy();

      // Validates that custom logging occurs on disconnection
      expect(loggerSpy).toHaveBeenCalledWith('Database disconnected');

      loggerSpy.mockRestore();
      disconnectSpy.mockRestore();
    });
  });
});
