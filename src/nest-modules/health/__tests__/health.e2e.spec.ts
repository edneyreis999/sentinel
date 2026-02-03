import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import * as request from 'supertest';
import { HealthModule } from '../health.module';
import { HealthService } from '../health.service';
import { HealthStatusEnum } from '../types/health-status.types';

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

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('timestamp');

      expect(Object.values(HealthStatusEnum).includes(response.body.status)).toBeTruthy();
      expect(typeof response.body.version).toBe('string');
      expect(typeof response.body.uptime).toBe('number');
      expect(typeof response.body.timestamp).toBe('string');
    });

    it('should return consistent health data on multiple calls', async () => {
      const response1 = await request(app.getHttpServer()).get('/health').expect(200);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const response2 = await request(app.getHttpServer()).get('/health').expect(200);

      expect(response1.body.version).toBe(response2.body.version);
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
      expect(response.body.data.health).toBeDefined();
      expect(response.body.data.health.status).toBeDefined();
      expect(response.body.data.health.version).toBeDefined();
      expect(response.body.data.health.uptime).toBeDefined();
      expect(response.body.data.health.timestamp).toBeDefined();

      expect(
        Object.values(HealthStatusEnum).includes(response.body.data.health.status),
      ).toBeTruthy();
      expect(typeof response.body.data.health.version).toBe('string');
      expect(typeof response.body.data.health.uptime).toBe('number');
      expect(typeof response.body.data.health.timestamp).toBe('string');
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

      expect(restResponse.body.version).toBe(graphqlResponse.body.data.health.version);
      // Uptime should be close (within 1 second)
      expect(
        Math.abs(restResponse.body.uptime - graphqlResponse.body.data.health.uptime),
      ).toBeLessThan(1);
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
