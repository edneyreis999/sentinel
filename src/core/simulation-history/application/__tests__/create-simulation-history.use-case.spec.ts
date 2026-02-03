import { CreateSimulationHistoryUseCase } from '../use-cases/create-simulation-history.use-case';
import { SimulationHistoryInMemoryRepository } from '../../infra/db/in-memory/simulation-history-in-memory.repository';
import { SimulationStatus } from '../../domain/value-objects';
import { CreateSimulationHistoryInputFakeBuilder } from './_fakes/create-simulation-history-input.fake-builder';

/**
 * CreateSimulationHistoryUseCase Tests
 *
 * Uses real in-memory repository instead of mocks to:
 * - Test actual persistence behavior
 * - Avoid over-mocking (previously mocked 6 methods when only insert was used)
 * - Enable future validation of persisted data
 *
 * Reference: get-user-preferences.use-case.spec.ts
 */
describe('CreateSimulationHistoryUseCase', () => {
  let useCase: CreateSimulationHistoryUseCase;
  let repository: SimulationHistoryInMemoryRepository;

  beforeEach(() => {
    repository = new SimulationHistoryInMemoryRepository();
    useCase = new CreateSimulationHistoryUseCase(repository);
  });

  it('should create a simulation history entry successfully', async () => {
    const input = CreateSimulationHistoryInputFakeBuilder.anInput()
      .withProjectPath('/test/project')
      .withProjectName('Test Project')
      .withStatus(SimulationStatus.PENDING)
      .withTtkVersion('1.0.0')
      .withConfigJson('{"test": true}')
      .withSummaryJson('{"summary": "test"}')
      .withDurationMs(1000)
      .withBattleCount(10)
      .withTrechoCount(5)
      .build();

    const result = await useCase.execute(input);

    expect(result).toBeDefined();
    expect(result.projectPath).toBe(input.projectPath);
    expect(result.projectName).toBe(input.projectName);
    expect(result.status).toBe(input.status);
  });

  it('should create entry with default PENDING status', async () => {
    const input = CreateSimulationHistoryInputFakeBuilder.anInput()
      .withProjectPath('/test/project')
      .withProjectName('Test Project')
      .withTtkVersion('1.0.0')
      .withConfigJson('{"test": true}')
      .withSummaryJson('{"summary": "test"}')
      .withDurationMs(1000)
      .withBattleCount(10)
      .withTrechoCount(5)
      .build();

    const result = await useCase.execute(input);

    expect(result.status).toBe(SimulationStatus.PENDING);
  });

  it('should create entry with RUNNING status', async () => {
    const input = CreateSimulationHistoryInputFakeBuilder.anInput()
      .withProjectPath('/test/project')
      .withProjectName('Test Project')
      .withStatus(SimulationStatus.RUNNING)
      .withTtkVersion('1.0.0')
      .withConfigJson('{"test": true}')
      .withSummaryJson('{"summary": "test"}')
      .withDurationMs(1000)
      .withBattleCount(10)
      .withTrechoCount(5)
      .build();

    const result = await useCase.execute(input);

    expect(result.status).toBe(SimulationStatus.RUNNING);
  });
});
