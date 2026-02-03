import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import * as request from 'supertest';
import { HealthModule } from '../health.module';
import { HealthService } from '../health.service';
import { HealthStatusEnum } from '../types/health-status.types';

// Test constants
const TEST_DELAYS = {
  UPTIME_CHECK_MS: 100,
} as const;

/**
 * Acceptable delta for uptime measurements in seconds.
 * Allows for 1 second variance due to test execution time and system clock precision.
 */
const ACCEPTABLE_UPTIME_DELTA_SECONDS = 1;

describe('Health E2E Tests', () => {
  let app: INestApplication;
  let healthService: HealthService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: join(process.cwd(), 'test/schema.gql'),
          sortSchema: true,
          playground: false,
        }),
        HealthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    healthService = app.get<HealthService>(HealthService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('REST Endpoint', () => {
    it('/health (GET)', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toMatchObject({
        status: expect.any(String),
        version: expect.any(String),
        uptime: expect.any(Number),
        timestamp: expect.any(String),
      });

      expect(Object.values(HealthStatusEnum).includes(response.body.status)).toBeTruthy();
    });

    it('should return consistent health data on multiple calls', async () => {
      const response1 = await request(app.getHttpServer()).get('/health').expect(200);

      await new Promise((resolve) => setTimeout(resolve, TEST_DELAYS.UPTIME_CHECK_MS));

      const response2 = await request(app.getHttpServer()).get('/health').expect(200);

      // Version should remain constant across calls
      expect(response1.body.version).toBe(response2.body.version);
      // Uptime should increase between calls
      expect(response2.body.uptime).toBeGreaterThan(response1.body.uptime);
    });
  });

  describe('GraphQL Query', () => {
    const HEALTH_QUERY = `
      query {
        health {
          status
          version
          uptime
          timestamp
        }
      }
    `;

    it('should return health status', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Content-Type', 'application/json')
        .send({
          query: HEALTH_QUERY,
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.health).toMatchObject({
        status: expect.any(String),
        version: expect.any(String),
        uptime: expect.any(Number),
        timestamp: expect.any(String),
      });

      expect(
        Object.values(HealthStatusEnum).includes(response.body.data.health.status),
      ).toBeTruthy();
    });

    it('should return consistent data via GraphQL and REST', async () => {
      const restResponse = await request(app.getHttpServer()).get('/health').expect(200);

      const graphqlResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Content-Type', 'application/json')
        .send({
          query: HEALTH_QUERY,
        })
        .expect(200);

      // Version should match between REST and GraphQL endpoints
      expect(restResponse.body.version).toBe(graphqlResponse.body.data.health.version);
      // Uptime should be within 1 second between REST and GraphQL calls
      expect(
        Math.abs(restResponse.body.uptime - graphqlResponse.body.data.health.uptime),
      ).toBeLessThan(ACCEPTABLE_UPTIME_DELTA_SECONDS);
    });
  });

  describe('Health Service Integration', () => {
    it('should be properly injected', () => {
      expect(healthService).toBeDefined();
    });

    it('should return valid health status', () => {
      const status = healthService.getStatus();

      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('version');
      expect(status).toHaveProperty('uptime');
      expect(status).toHaveProperty('timestamp');

      expect(Object.values(HealthStatusEnum).includes(status.status)).toBeTruthy();
      expect(typeof status.version).toBe('string');
      expect(typeof status.uptime).toBe('number');
      expect(status.timestamp).toBeInstanceOf(Date);
    });
  });
});
