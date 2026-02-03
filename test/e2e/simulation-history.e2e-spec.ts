import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';

describe('Simulation History Module (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let prisma: PrismaService;
  let graphqlUrl: string;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();

    graphqlUrl = '/graphql';
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.simulationHistoryEntry.deleteMany();

    await app.close();
  });

  beforeEach(async () => {
    // Clean up before each test
    await prisma.simulationHistoryEntry.deleteMany();
  });

  describe('Mutation: createSimulationHistoryEntry', () => {
    it('should create a simulation history entry', async () => {
      const mutation = `
        mutation {
          createSimulationHistoryEntry(
            projectPath: "/test/project"
            projectName: "Test Project"
            ttkVersion: "1.0.0"
            configJson: "{\"test\": true}"
            summaryJson: "{\"summary\": \"test\"}"
            durationMs: 1000
            battleCount: 10
            trechoCount: 5
          ) {
            id
            projectPath
            projectName
            status
            ttkVersion
            configJson
            summaryJson
            hasReport
            durationMs
            battleCount
            trechoCount
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query: mutation })
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.data.createSimulationHistoryEntry).toBeDefined();
      expect(response.body.data.createSimulationHistoryEntry.id).toBeDefined();
      expect(response.body.data.createSimulationHistoryEntry.projectPath).toBe('/test/project');
      expect(response.body.data.createSimulationHistoryEntry.projectName).toBe('Test Project');
      expect(response.body.data.createSimulationHistoryEntry.status).toBe('PENDING');
    });

    it('should create entry with RUNNING status', async () => {
      const mutation = `
        mutation {
          createSimulationHistoryEntry(
            projectPath: "/test/project2"
            projectName: "Test Project 2"
            status: RUNNING
            ttkVersion: "1.0.0"
            configJson: "{\"test\": true}"
            durationMs: 1000
            battleCount: 10
            trechoCount: 5
          ) {
            id
            status
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query: mutation })
        .expect(200);

      expect(response.body.data.createSimulationHistoryEntry.status).toBe('RUNNING');
    });

    it('should return error for invalid status transition', async () => {
      // First create an entry with COMPLETED status
      const createMutation = `
        mutation {
          createSimulationHistoryEntry(
            projectPath: "/test/project3"
            projectName: "Test Project 3"
            status: COMPLETED
            ttkVersion: "1.0.0"
            configJson: "{\"test\": true}"
            summaryJson: "{\"result\": \"done\"}"
            durationMs: 1000
            battleCount: 10
            trechoCount: 5
          ) {
            id
          }
        }
      `;

      const createResponse = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query: createMutation });

      const entryId = createResponse.body.data.createSimulationHistoryEntry.id;

      // Try to update to RUNNING (invalid transition from COMPLETED)
      const updateMutation = `
        mutation {
          updateSimulationStatus(
            id: "${entryId}"
            status: RUNNING
          ) {
            id
            status
          }
        }
      `;

      const updateResponse = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query: updateMutation })
        .expect(200);

      // Should return errors for invalid transition
      expect(updateResponse.body.errors).toBeDefined();
    });
  });

  describe('Query: simulationHistory', () => {
    beforeEach(async () => {
      // Seed test data
      await prisma.simulationHistoryEntry.createMany({
        data: [
          {
            projectPath: '/project1',
            projectName: 'Project 1',
            status: 'PENDING',
            ttkVersion: '1.0.0',
            configJson: '{}',
            summaryJson: '{}',
            hasReport: false,
            durationMs: 1000,
            battleCount: 10,
            trechoCount: 5,
          },
          {
            projectPath: '/project2',
            projectName: 'Project 2',
            status: 'RUNNING',
            ttkVersion: '1.0.0',
            configJson: '{}',
            summaryJson: '{}',
            hasReport: false,
            durationMs: 2000,
            battleCount: 20,
            trechoCount: 10,
          },
          {
            projectPath: '/project3',
            projectName: 'Project 3',
            status: 'COMPLETED',
            ttkVersion: '1.0.0',
            configJson: '{}',
            summaryJson: '{"result": "success"}',
            hasReport: false,
            durationMs: 3000,
            battleCount: 30,
            trechoCount: 15,
          },
        ],
      });
    });

    it('should return all simulation history entries', async () => {
      const query = `
        query {
          simulationHistory {
            id
            projectPath
            projectName
            status
            ttkVersion
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query: query })
        .expect(200);

      expect(response.body.data.simulationHistory).toBeDefined();
      expect(response.body.data.simulationHistory.length).toBe(3);
    });

    it('should filter by status', async () => {
      const query = `
        query {
          simulationHistory(status: "RUNNING") {
            id
            status
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query: query })
        .expect(200);

      expect(response.body.data.simulationHistory.length).toBe(1);
      expect(response.body.data.simulationHistory[0].status).toBe('RUNNING');
    });

    it('should filter by project path', async () => {
      const query = `
        query {
          simulationHistory(projectPath: "/project1") {
            id
            projectPath
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query: query })
        .expect(200);

      expect(response.body.data.simulationHistory.length).toBe(1);
      expect(response.body.data.simulationHistory[0].projectPath).toBe('/project1');
    });

    it('should paginate results', async () => {
      const query = `
        query {
          simulationHistory(page: 1, perPage: 2) {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query: query })
        .expect(200);

      expect(response.body.data.simulationHistory.length).toBe(2);
    });
  });

  describe('Query: simulationHistoryEntry', () => {
    it('should return a single entry by ID', async () => {
      // Create an entry
      const createMutation = `
        mutation {
          createSimulationHistoryEntry(
            projectPath: "/test/single"
            projectName: "Single Test"
            ttkVersion: "1.0.0"
            configJson: "{}"
            summaryJson: "{}"
            durationMs: 1000
            battleCount: 10
            trechoCount: 5
          ) {
            id
          }
        }
      `;

      const createResponse = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query: createMutation });

      const entryId = createResponse.body.data.createSimulationHistoryEntry.id;

      const query = `
        query {
          simulationHistoryEntry(id: "${entryId}") {
            id
            projectPath
            projectName
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query: query })
        .expect(200);

      expect(response.body.data.simulationHistoryEntry).toBeDefined();
      expect(response.body.data.simulationHistoryEntry.id).toBe(entryId);
    });

    it('should return null for non-existent ID', async () => {
      const query = `
        query {
          simulationHistoryEntry(id: "non-existent-id") {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query: query })
        .expect(200);

      expect(response.body.data.simulationHistoryEntry).toBeNull();
    });
  });

  describe('Mutation: updateSimulationStatus', () => {
    it('should update status from PENDING to RUNNING', async () => {
      // Create an entry
      const createMutation = `
        mutation {
          createSimulationHistoryEntry(
            projectPath: "/test/update"
            projectName: "Update Test"
            ttkVersion: "1.0.0"
            configJson: "{}"
            summaryJson: "{}"
            durationMs: 1000
            battleCount: 10
            trechoCount: 5
          ) {
            id
            status
          }
        }
      `;

      const createResponse = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query: createMutation });

      const entryId = createResponse.body.data.createSimulationHistoryEntry.id;

      // Update status to RUNNING
      const updateMutation = `
        mutation {
          updateSimulationStatus(
            id: "${entryId}"
            status: RUNNING
          ) {
            id
            status
          }
        }
      `;

      const updateResponse = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query: updateMutation })
        .expect(200);

      expect(updateResponse.body.data.updateSimulationStatus.status).toBe('RUNNING');
    });

    it('should update status from RUNNING to COMPLETED', async () => {
      // Create a RUNNING entry
      const createMutation = `
        mutation {
          createSimulationHistoryEntry(
            projectPath: "/test/update2"
            projectName: "Update Test 2"
            status: RUNNING
            ttkVersion: "1.0.0"
            configJson: "{}"
            summaryJson: "{}"
            durationMs: 1000
            battleCount: 10
            trechoCount: 5
          ) {
            id
            status
          }
        }
      `;

      const createResponse = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query: createMutation });

      const entryId = createResponse.body.data.createSimulationHistoryEntry.id;

      // Update status to COMPLETED
      const updateMutation = `
        mutation {
          updateSimulationStatus(
            id: "${entryId}"
            status: COMPLETED
            summaryJson: "{\"result\": \"success\"}"
          ) {
            id
            status
            summaryJson
          }
        }
      `;

      const updateResponse = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query: updateMutation })
        .expect(200);

      expect(updateResponse.body.data.updateSimulationStatus.status).toBe('COMPLETED');
      expect(updateResponse.body.data.updateSimulationStatus.summaryJson).toContain('success');
    });

    it('should update status from RUNNING to FAILED', async () => {
      // Create a RUNNING entry
      const createMutation = `
        mutation {
          createSimulationHistoryEntry(
            projectPath: "/test/update3"
            projectName: "Update Test 3"
            status: RUNNING
            ttkVersion: "1.0.0"
            configJson: "{}"
            summaryJson: "{}"
            durationMs: 1000
            battleCount: 10
            trechoCount: 5
          ) {
            id
            status
          }
        }
      `;

      const createResponse = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query: createMutation });

      const entryId = createResponse.body.data.createSimulationHistoryEntry.id;

      // Update status to FAILED
      const updateMutation = `
        mutation {
          updateSimulationStatus(
            id: "${entryId}"
            status: FAILED
            summaryJson: "{\"error\": \"Something went wrong\"}"
          ) {
            id
            status
            summaryJson
          }
        }
      `;

      const updateResponse = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query: updateMutation })
        .expect(200);

      expect(updateResponse.body.data.updateSimulationStatus.status).toBe('FAILED');
      expect(updateResponse.body.data.updateSimulationStatus.summaryJson).toContain('error');
    });
  });

  describe('Mutation: deleteSimulationHistory', () => {
    it('should delete an entry', async () => {
      // Create an entry
      const createMutation = `
        mutation {
          createSimulationHistoryEntry(
            projectPath: "/test/delete"
            projectName: "Delete Test"
            ttkVersion: "1.0.0"
            configJson: "{}"
            summaryJson: "{}"
            durationMs: 1000
            battleCount: 10
            trechoCount: 5
          ) {
            id
          }
        }
      `;

      const createResponse = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query: createMutation });

      const entryId = createResponse.body.data.createSimulationHistoryEntry.id;

      // Delete the entry
      const deleteMutation = `
        mutation {
          deleteSimulationHistory(id: "${entryId}")
        }
      `;

      const deleteResponse = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query: deleteMutation })
        .expect(200);

      expect(deleteResponse.body.data.deleteSimulationHistory).toBe(true);

      // Verify entry is deleted
      const query = `
        query {
          simulationHistoryEntry(id: "${entryId}") {
            id
          }
        }
      `;

      const queryResponse = await request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query: query })
        .expect(200);

      expect(queryResponse.body.data.simulationHistoryEntry).toBeNull();
    });
  });

  describe('GraphQL Schema', () => {
    it('should expose SimulationHistoryEntry type', async () => {
      const query = `
        {
          __type(name: "SimulationHistoryEntryGraphQL") {
            name
            kind
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
        .post(graphqlUrl)
        .send({ query: query })
        .expect(200);

      expect(response.body.data.__type).toBeDefined();
      expect(response.body.data.__type.name).toBe('SimulationHistoryEntryGraphQL');
      expect(response.body.data.__type.fields).toBeDefined();
      expect(response.body.data.__type.fields.length).toBeGreaterThan(0);
    });

    it('should expose simulationHistory query', async () => {
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
        .post(graphqlUrl)
        .send({ query: query })
        .expect(200);

      const simulationHistoryField = response.body.data.__schema.queryType.fields.find(
        (field: { name: string }) => field.name === 'simulationHistory',
      );

      expect(simulationHistoryField).toBeDefined();
    });

    it('should expose createSimulationHistoryEntry mutation', async () => {
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
        .post(graphqlUrl)
        .send({ query: query })
        .expect(200);

      const createField = response.body.data.__schema.mutationType.fields.find(
        (field: { name: string }) => field.name === 'createSimulationHistoryEntry',
      );

      expect(createField).toBeDefined();
    });
  });
});
