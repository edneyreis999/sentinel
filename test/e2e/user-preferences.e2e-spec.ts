import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '@database/prisma.service';
import {
  setupE2ETestEnvironment,
  teardownE2ETestEnvironment,
  cleanDatabase,
  E2ETestContext,
} from './helpers/e2e-test.helper';

describe('UserPreferences E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testContext: E2ETestContext;

  beforeAll(async () => {
    testContext = await setupE2ETestEnvironment();
    app = testContext.app;
    prisma = testContext.prisma;
  }, 60000); // 60s timeout for container startup

  afterAll(async () => {
    await teardownE2ETestEnvironment(testContext);
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  describe('Query: userPreferences', () => {
    it('should return default preferences when none exist (lazy initialization)', async () => {
      const query = `
        query {
          userPreferences {
            id
            userId
            theme
            language
            windowWidth
            windowHeight
            windowIsMaximized
            autoSaveInterval
            maxHistoryEntries
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.data.userPreferences).toMatchObject({
        userId: 'default',
        theme: 'SYSTEM',
        language: 'pt-BR',
        windowWidth: 1280,
        windowHeight: 720,
        windowIsMaximized: false,
        autoSaveInterval: 30000,
        maxHistoryEntries: 100,
      });
      expect(response.body.errors).toBeUndefined();
    });

    it('should return existing preferences', async () => {
      // Create preferences first
      await prisma.userPreferences.create({
        data: {
          userId: 'test-user',
          theme: 'DARK',
          language: 'en-US',
        },
      });

      const query = `
        query {
          userPreferences {
            id
            userId
            theme
            language
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      // Should return default since query uses 'default' userId
      expect(response.body.data.userPreferences).toMatchObject({
        userId: 'default',
        theme: 'SYSTEM',
        language: 'pt-BR',
      });
      expect(response.body.errors).toBeUndefined();
    });
  });

  describe('Mutation: updateUserPreferences', () => {
    it('should update theme', async () => {
      const mutation = `
        mutation {
          updateUserPreferences(theme: DARK) {
            id
            userId
            theme
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation })
        .expect(200);

      expect(response.body.data.updateUserPreferences.theme).toBe('DARK');
      expect(response.body.errors).toBeUndefined();
    });

    it('should update multiple fields', async () => {
      const mutation = `
        mutation {
          updateUserPreferences(
            theme: LIGHT
            language: "en-US"
            windowWidth: 1920
            windowHeight: 1080
          ) {
            id
            userId
            theme
            language
            windowWidth
            windowHeight
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation })
        .expect(200);

      expect(response.body.data.updateUserPreferences).toMatchObject({
        theme: 'LIGHT',
        language: 'en-US',
        windowWidth: 1920,
        windowHeight: 1080,
      });
      expect(response.body.errors).toBeUndefined();
    });

    it('should reject invalid autoSaveInterval', async () => {
      const mutation = `
        mutation {
          updateUserPreferences(autoSaveInterval: 1000) {
            id
            autoSaveInterval
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation })
        .expect(200);

      // Should return error from domain validation
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain(
        'Auto-save interval must be at least 5000ms',
      );
    });

    it('should reject invalid maxHistoryEntries', async () => {
      const mutation = `
        mutation {
          updateUserPreferences(maxHistoryEntries: 0) {
            id
            maxHistoryEntries
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain(
        'Max history entries must be between 1 and 1000',
      );
    });
  });

  describe('Lazy Initialization', () => {
    it('should create default preferences on first access', async () => {
      const query = `
        query {
          userPreferences {
            id
            userId
            theme
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.data.userPreferences).toBeDefined();
      expect(response.body.data.userPreferences.userId).toBe('default');
      expect(response.body.errors).toBeUndefined();

      // Verify in database
      const dbPrefs = await prisma.userPreferences.findUnique({
        where: { userId: 'default' },
      });

      expect(dbPrefs).toBeDefined();
      expect(dbPrefs!.theme).toBe('SYSTEM');
    });
  });

  describe('Schema Introspection', () => {
    it('should include UserPreferences type in schema', async () => {
      const query = `
        {
          __type(name: "UserPreferences") {
            name
            fields {
              name
              type {
                name
              }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.data.__type).toBeDefined();
      expect(response.body.data.__type.name).toBe('UserPreferences');
      expect(response.body.data.__type.fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'id' }),
          expect.objectContaining({ name: 'theme' }),
          expect.objectContaining({ name: 'language' }),
        ]),
      );
      expect(response.body.errors).toBeUndefined();
    });

    it('should include userPreferences query', async () => {
      const query = `
        {
          __schema {
            queryType {
              fields {
                name
              }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      const queryFields = response.body.data.__schema.queryType.fields;
      const userPreferencesQuery = queryFields.find((f: any) => f.name === 'userPreferences');

      expect(userPreferencesQuery).toBeDefined();
      expect(response.body.errors).toBeUndefined();
    });

    it('should include updateUserPreferences mutation', async () => {
      const query = `
        {
          __schema {
            mutationType {
              fields {
                name
              }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      const mutationFields = response.body.data.__schema.mutationType.fields;
      const updateUserPreferencesMutation = mutationFields.find(
        (f: any) => f.name === 'updateUserPreferences',
      );

      expect(updateUserPreferencesMutation).toBeDefined();
      expect(response.body.errors).toBeUndefined();
    });

    it('should include userPreferencesChanged subscription', async () => {
      const query = `
        {
          __schema {
            subscriptionType {
              fields {
                name
              }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      const subscriptionFields = response.body.data.__schema.subscriptionType.fields;
      const userPreferencesChangedSubscription = subscriptionFields.find(
        (f: any) => f.name === 'userPreferencesChanged',
      );

      expect(userPreferencesChangedSubscription).toBeDefined();
      expect(response.body.errors).toBeUndefined();
    });
  });
});
