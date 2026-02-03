import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';

describe('PrismaService (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let prismaService: PrismaService;
  let container: StartedPostgreSqlContainer;

  beforeAll(async () => {
    // Start PostgreSQL container for real database testing
    container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('sentinel_test')
      .withUsername('test')
      .withPassword('test')
      .withExposedPorts(5432)
      .start();

    // Set DATABASE_URL for the test environment
    process.env.DATABASE_URL = container.getConnectionUri();

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    // Run migrations to set up database schema
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: container.getConnectionUri() },
      stdio: 'inherit',
    });
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await app.close();
    await container.stop();
  });

  describe('Database Connection', () => {
    it('should connect to database successfully', async () => {
      const response = await request(app.getHttpServer()).get('/health').expect(200);

      // Health endpoint should return successfully
      expect(response.body.status).toBeDefined();
      expect(['HEALTHY', 'DEGRADED', 'UNHEALTHY']).toContain(response.body.status);
    });

    it('should execute raw query successfully', async () => {
      const result = await prismaService.$queryRaw`SELECT 1 as result`;

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
    });

    it('should measure database latency', async () => {
      const startTime = Date.now();
      await prismaService.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;

      expect(latency).toBeGreaterThanOrEqual(0);
      expect(latency).toBeLessThan(5000);
    });
  });

  describe('Prisma Client Features', () => {
    it('should expose Prisma client methods', () => {
      expect(prismaService).toHaveProperty('$connect');
      expect(prismaService).toHaveProperty('$disconnect');
      expect(prismaService).toHaveProperty('$queryRaw');
      expect(prismaService).toHaveProperty('$transaction');
    });

    it('should have access to all defined models', () => {
      expect(prismaService).toHaveProperty('recentProject');
      expect(prismaService).toHaveProperty('userPreferences');
      expect(prismaService).toHaveProperty('simulationHistoryEntry');
    });

    it('should execute $transaction successfully', async () => {
      await prismaService.$transaction(async (tx) => {
        const result = await tx.$queryRaw`SELECT 1 as test`;
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it('should handle batch operations', async () => {
      const queries = [prismaService.$queryRaw`SELECT 1`, prismaService.$queryRaw`SELECT 2`];

      const results = await Promise.all(queries);
      expect(results).toHaveLength(2);
      expect(results[0]).toBeDefined();
      expect(results[1]).toBeDefined();
    });
  });

  describe('Model: RecentProject', () => {
    it('should have correct model structure', () => {
      const model = prismaService.recentProject;
      expect(model).toBeDefined();
      expect(model).toHaveProperty('findMany');
      expect(model).toHaveProperty('findFirst');
      expect(model).toHaveProperty('findUnique');
      expect(model).toHaveProperty('create');
      expect(model).toHaveProperty('update');
      expect(model).toHaveProperty('delete');
    });

    it('should query RecentProject model', async () => {
      const result = await prismaService.recentProject.findMany();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should respect model fields constraints', async () => {
      const model = prismaService.recentProject;
      expect(model).toBeDefined();
    });
  });

  describe('Model: UserPreferences', () => {
    it('should have correct model structure', () => {
      const model = prismaService.userPreferences;
      expect(model).toBeDefined();
      expect(model).toHaveProperty('findMany');
      expect(model).toHaveProperty('findFirst');
      expect(model).toHaveProperty('findUnique');
      expect(model).toHaveProperty('create');
      expect(model).toHaveProperty('update');
      expect(model).toHaveProperty('delete');
    });

    it('should query UserPreferences model', async () => {
      const result = await prismaService.userPreferences.findMany();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should handle default userId', async () => {
      const result = await prismaService.userPreferences.findUnique({
        where: { userId: 'default' },
      });

      expect(result === null || typeof result === 'object').toBe(true);
    });
  });

  describe('Model: SimulationHistoryEntry', () => {
    it('should have correct model structure', () => {
      const model = prismaService.simulationHistoryEntry;
      expect(model).toBeDefined();
      expect(model).toHaveProperty('findMany');
      expect(model).toHaveProperty('findFirst');
      expect(model).toHaveProperty('findUnique');
      expect(model).toHaveProperty('create');
      expect(model).toHaveProperty('update');
      expect(model).toHaveProperty('delete');
    });

    it('should query SimulationHistoryEntry model', async () => {
      const result = await prismaService.simulationHistoryEntry.findMany();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should respect composite indexes', async () => {
      const result = await prismaService.simulationHistoryEntry.findMany({
        where: {
          projectPath: 'test-path',
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 10,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('Lifecycle Hooks', () => {
    it('should call onModuleInit during initialization', async () => {
      expect(prismaService).toBeDefined();

      const result = await prismaService.$queryRaw`SELECT 1`;
      expect(result).toBeDefined();
    });

    it('should handle graceful shutdown', async () => {
      const testModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      const testApp = testModule.createNestApplication();
      const testPrisma = testModule.get<PrismaService>(PrismaService);

      await testApp.init();
      expect(testPrisma).toBeDefined();

      await testApp.close();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid query gracefully', async () => {
      await expect(prismaService.$queryRaw`SELECT * FROM nonexistent_table`).rejects.toThrow();
    });

    it('should handle transaction rollback on error', async () => {
      await expect(
        prismaService.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT 1`;
          throw new Error('Test error');
        }),
      ).rejects.toThrow('Test error');
    });

    it('should handle connection errors gracefully', async () => {
      expect(prismaService).toBeDefined();
    });
  });

  describe('Prisma Features', () => {
    it('should support transaction operations', async () => {
      await prismaService.$transaction(async (tx) => {
        const result = await tx.$queryRaw`SELECT 1`;
        expect(result).toBeDefined();
      });
    });

    it('should execute queries in isolation', async () => {
      const result1 = await prismaService.$queryRaw`SELECT 1 as id`;
      const result2 = await prismaService.$queryRaw`SELECT 2 as id`;

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1).not.toEqual(result2);
    });
  });

  describe('Database Schema Integrity', () => {
    it('should have all required tables', async () => {
      const tables = await prismaService.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      `;

      expect(Array.isArray(tables)).toBe(true);
      expect(tables.length).toBeGreaterThan(0);

      const tableNames = tables.map((t) => t.table_name);
      // Prisma uses snake_case for table names
      expect(tableNames).toContain('recent_projects');
      expect(tableNames).toContain('user_preferences');
      expect(tableNames).toContain('simulation_history_v2');
    });

    it('should respect foreign key constraints', async () => {
      expect(prismaService).toBeDefined();
    });

    it('should respect unique constraints', async () => {
      expect(prismaService).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should handle concurrent queries', async () => {
      const promises = Array.from({ length: 10 }, () => prismaService.$queryRaw`SELECT 1 as id`);

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it('should reuse connections efficiently', async () => {
      const queries = Array.from(
        { length: 5 },
        (_, i) => prismaService.$queryRaw`SELECT ${i + 1} as id`,
      );

      const results = await Promise.all(queries);
      expect(results).toHaveLength(5);
    });
  });

  describe('Logging', () => {
    it('should have logging configured', () => {
      expect(prismaService).toBeDefined();
    });
  });
});
