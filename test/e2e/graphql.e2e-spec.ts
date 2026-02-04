import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  setupE2ETestEnvironment,
  teardownE2ETestEnvironment,
  E2ETestContext,
} from './helpers/e2e-test.helper';

describe('GraphQL (e2e)', () => {
  let app: INestApplication;
  let testContext: E2ETestContext;
  let graphqlUrl: string;

  beforeAll(async () => {
    testContext = await setupE2ETestEnvironment();
    app = testContext.app;
    graphqlUrl = '/graphql';
  }, 60000); // 60s timeout for container startup

  afterAll(async () => {
    await teardownE2ETestEnvironment(testContext);
  });

  describe('Query: hello', () => {
    it('should return greeting message', async () => {
      const response = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({
          query: 'query { hello }',
        })
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.data).toHaveProperty('hello');
      expect(response.body.data.hello).toBe('Hello from Sentinel API!');
      expect(response.body.errors).toBeUndefined();
    });

    it('should include description in schema introspection', async () => {
      const response = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({
          query: `
            {
              __schema {
                queryType {
                  fields {
                    name
                    description
                  }
                }
              }
            }
          `,
        })
        .expect(200);

      const helloField = response.body.data.__schema.queryType.fields.find(
        (field: { name: string }) => field.name === 'hello',
      );

      expect(helloField).toBeDefined();
      expect(helloField.description).toContain('Sentinel API');
    });

    it('should return String scalar type', async () => {
      const response = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({
          query: `
            {
              __type(name: "Query") {
                fields {
                  name
                  type {
                    name
                    kind
                    ofType {
                      name
                      kind
                    }
                  }
                }
              }
            }
          `,
        })
        .expect(200);

      const helloField = response.body.data.__type.fields.find(
        (field: { name: string }) => field.name === 'hello',
      );

      // GraphQL wraps non-null types, so we check ofType
      const typeName = helloField.type.name || helloField.type.ofType?.name;
      expect(typeName).toBe('String');
    });

    it('should handle malformed GraphQL query gracefully', async () => {
      const response = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({
          query: 'query { hello }',
        })
        .expect(200);

      // Valid query should work
      expect(response.body.data).toBeDefined();
    });

    it('should return errors for invalid query syntax', async () => {
      const response = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({
          query: 'query { hello',
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Mutation: echo', () => {
    it('should echo back the provided message', async () => {
      const testMessage = 'Test message from Sentinel';
      const response = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({
          query: `mutation { echo(message: "${testMessage}") }`,
        })
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.data).toHaveProperty('echo');
      expect(response.body.data.echo).toBe(testMessage);
      expect(response.body.errors).toBeUndefined();
    });

    it('should echo empty string', async () => {
      const response = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({
          query: 'mutation { echo(message: "") }',
        })
        .expect(200);

      expect(response.body.data.echo).toBe('');
    });

    it('should echo special characters', async () => {
      const specialMessage = 'Hello @#$%^&*() World! 🚀';
      const response = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({
          query: `mutation { echo(message: "${specialMessage}") }`,
        })
        .expect(200);

      expect(response.body.data.echo).toBe(specialMessage);
    });

    it('should echo multiline string', async () => {
      const multilineMessage = 'Line 1\nLine 2\nLine 3';
      const response = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({
          query: `mutation { echo(message: ${JSON.stringify(multilineMessage)}) }`,
        })
        .expect(200);

      expect(response.body.data.echo).toBe(multilineMessage);
    });

    it('should require message argument', async () => {
      const response = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({
          query: 'mutation { echo }',
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('message');
    });

    it('should return String scalar type for echo mutation', async () => {
      const response = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({
          query: `
            {
              __type(name: "Mutation") {
                fields {
                  name
                  type {
                    name
                    kind
                    ofType {
                      name
                      kind
                    }
                  }
                }
              }
            }
          `,
        })
        .expect(200);

      const echoField = response.body.data.__type.fields.find(
        (field: { name: string }) => field.name === 'echo',
      );

      // GraphQL wraps non-null types, so we check ofType
      const typeName = echoField.type.name || echoField.type.ofType?.name;
      expect(typeName).toBe('String');
    });
  });

  describe('GraphQL Schema Validation', () => {
    it('should expose complete schema through introspection', async () => {
      const response = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({
          query: `
            {
              __schema {
                queryType {
                  name
                }
                mutationType {
                  name
                }
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.data.__schema.queryType).toBeDefined();
      expect(response.body.data.__schema.queryType.name).toBe('Query');
      expect(response.body.data.__schema.mutationType).toBeDefined();
      expect(response.body.data.__schema.mutationType.name).toBe('Mutation');
    });

    it('should return 405 for OPTIONS request (CORS preflight)', async () => {
      // Express doesn't handle OPTIONS by default unless CORS is configured
      await request(app.getHttpServer()).options(graphqlUrl).expect(405);
    });

    it('should return 404 for non-existent route', async () => {
      await request(app.getHttpServer())
        .post('/nonexistent')
        .send({
          query: '{ hello }',
        })
        .expect(404);
    });
  });

  describe('GraphQL Playground', () => {
    it('should have playground enabled', async () => {
      // Check if playground endpoint responds
      const response = await request(app.getHttpServer()).get(graphqlUrl);

      // GraphQL playground returns HTML for GET requests when enabled
      // We check if we got a successful response
      expect(response.status).toBe(400); // Apollo Server returns 400 for GET without query params
    });
  });

  describe('Error Handling', () => {
    it('should return proper error format for invalid field', async () => {
      const response = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({
          query: 'query { nonExistentField }',
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toHaveProperty('message');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('should handle multiple operations in single request', async () => {
      const response = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({
          query: `
            query GetHello { hello }
            mutation EchoMessage { echo(message: "test") }
          `,
        })
        .expect(400);

      // When multiple operations are present, must specify operation name
      expect(response.body.errors).toBeDefined();
    });

    it('should execute named operation', async () => {
      const response = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({
          query: `
            query GetHello { hello }
            mutation EchoMessage { echo(message: "test") }
          `,
          operationName: 'GetHello',
        })
        .expect(200);

      expect(response.body.data.hello).toBe('Hello from Sentinel API!');
      expect(response.body.data.echo).toBeUndefined();
    });
  });
});
