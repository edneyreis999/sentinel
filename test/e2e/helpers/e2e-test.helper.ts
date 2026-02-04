import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/database/prisma.service';

export interface E2ETestContext {
  app: INestApplication;
  moduleFixture: TestingModule;
  prisma: PrismaService;
  container: StartedPostgreSqlContainer;
}

/**
 * Sets up a complete E2E test environment with a real PostgreSQL database.
 * Uses testcontainers to spin up an isolated database for each test suite.
 */
export async function setupE2ETestEnvironment(): Promise<E2ETestContext> {
  // Start PostgreSQL container
  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('sentinel_test')
    .withUsername('test')
    .withPassword('test')
    .withExposedPorts(5432)
    .start();

  // Set DATABASE_URL for the test environment
  process.env.DATABASE_URL = container.getConnectionUri();

  // Create NestJS test module
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  await app.init();

  const prisma = moduleFixture.get<PrismaService>(PrismaService);

  // Run migrations to set up database schema
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: container.getConnectionUri() },
    stdio: 'pipe', // Suppress output for cleaner test logs
  });

  return { app, moduleFixture, prisma, container };
}

/**
 * Tears down the E2E test environment.
 * Disconnects from database and stops the container.
 */
export async function teardownE2ETestEnvironment(context: E2ETestContext): Promise<void> {
  await context.prisma.$disconnect();
  await context.app.close();
  await context.container.stop();
}

/**
 * Cleans all data from the database tables.
 * Useful for beforeEach hooks to ensure test isolation.
 */
export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  // Delete in order respecting foreign key constraints
  await prisma.simulationHistoryEntry.deleteMany();
  await prisma.userPreferences.deleteMany();
  await prisma.recentProject.deleteMany();
}
