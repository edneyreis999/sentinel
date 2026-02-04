import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  setupE2ETestEnvironment,
  teardownE2ETestEnvironment,
  E2ETestContext,
} from './helpers/e2e-test.helper';

// Test constants
const TEST_DELAYS = {
  UPTIME_CHECK_MS: 100,
} as const;

const ACCEPTABLE_UPTIME_DELTA_SECONDS = 1;

describe('HealthController (e2e)', () => {
  let app: INestApplication;
  let testContext: E2ETestContext;

  beforeAll(async () => {
    testContext = await setupE2ETestEnvironment();
    app = testContext.app;
  }, 60000); // 60s timeout for container startup

  afterAll(async () => {
    await teardownE2ETestEnvironment(testContext);
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

      await new Promise((resolve) => setTimeout(resolve, TEST_DELAYS.UPTIME_CHECK_MS));

      const secondResponse = await request(app.getHttpServer()).get('/health').expect(200);

      // Health status should remain consistent across calls
      expect(firstResponse.body.status).toBe(secondResponse.body.status);
      // Version should remain constant across calls
      expect(firstResponse.body.version).toBe(secondResponse.body.version);
      // Uptime should increase between calls
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

      // Version should match between REST and GraphQL endpoints
      expect(restResponse.body.version).toBe(graphqlResponse.body.data.health.version);
      // Uptime should be within 1 second between REST and GraphQL calls
      expect(
        Math.abs(restResponse.body.uptime - graphqlResponse.body.data.health.uptime),
      ).toBeLessThan(ACCEPTABLE_UPTIME_DELTA_SECONDS);
    });
  });
});
