import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('HealthController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('should return health status with all required fields', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status');
      expect(['HEALTHY', 'DEGRADED', 'UNHEALTHY']).toContain(response.body.status);
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
    });

    it('should return valid ISO timestamp', async () => {
      const response = await request(app.getHttpServer()).get('/health').expect(200);

      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
    });

    it('should return uptime as a positive number', async () => {
      const response = await request(app.getHttpServer()).get('/health').expect(200);

      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return version string', async () => {
      const response = await request(app.getHttpServer()).get('/health').expect(200);

      expect(typeof response.body.version).toBe('string');
      expect(response.body.version.length).toBeGreaterThan(0);
    });

    it('should return consistent health status on repeated calls', async () => {
      const firstResponse = await request(app.getHttpServer()).get('/health').expect(200);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const secondResponse = await request(app.getHttpServer()).get('/health').expect(200);

      expect(firstResponse.body.status).toBe(secondResponse.body.status);
      expect(firstResponse.body.version).toBe(secondResponse.body.version);
      expect(secondResponse.body.uptime).toBeGreaterThan(firstResponse.body.uptime);
    });
  });

  describe('GraphQL query health', () => {
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

    it('should return health status via GraphQL', async () => {
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
      expect(['HEALTHY', 'DEGRADED', 'UNHEALTHY']).toContain(response.body.data.health.status);
      expect(response.body.data.health.version).toBeDefined();
      expect(response.body.data.health.uptime).toBeDefined();
      expect(response.body.data.health.timestamp).toBeDefined();
    });

    it('should return consistent data between REST and GraphQL', async () => {
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
});
