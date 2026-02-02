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
      expect(['ok', 'degraded', 'down']).toContain(response.body.status);
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('services');
      expect(response.body.services).toHaveProperty('database');
    });

    it('should return valid ISO timestamp', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
    });

    it('should return uptime as a positive number', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return database status with latency when connected', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body.services.database).toHaveProperty('status');
      expect(['up', 'down']).toContain(response.body.services.database.status);

      if (response.body.services.database.status === 'up') {
        expect(response.body.services.database).toHaveProperty('latency');
        expect(typeof response.body.services.database.latency).toBe('number');
        expect(response.body.services.database.latency).toBeGreaterThanOrEqual(0);
      }
    });

    it('should return overall ok status when all services are up', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      if (response.body.services.database.status === 'up') {
        expect(response.body.status).toBe('ok');
      }
    });

    it('should return consistent health status on repeated calls', async () => {
      const firstResponse = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      const secondResponse = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(firstResponse.body.status).toBe(secondResponse.body.status);
      expect(firstResponse.body.services.database.status).toBe(
        secondResponse.body.services.database.status,
      );
    });
  });
});
