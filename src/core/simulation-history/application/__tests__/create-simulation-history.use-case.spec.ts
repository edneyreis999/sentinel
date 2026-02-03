import { CreateSimulationHistoryUseCase } from '../use-cases/create-simulation-history.use-case';
import { ISimulationHistoryRepository } from '../../domain/ports';
import { SimulationStatus } from '../../domain/value-objects';

describe('CreateSimulationHistoryUseCase', () => {
  let useCase: CreateSimulationHistoryUseCase;
  let repository: jest.Mocked<ISimulationHistoryRepository>;

  beforeEach(() => {
    repository = {
      insert: jest.fn(),
      findById: jest.fn(),
      search: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };
    useCase = new CreateSimulationHistoryUseCase(repository);
  });

  it('should create a simulation history entry successfully', async () => {
    const input = {
      projectPath: '/test/project',
      projectName: 'Test Project',
      status: SimulationStatus.PENDING,
      ttkVersion: '1.0.0',
      configJson: '{"test": true}',
      summaryJson: '{"summary": "test"}',
      durationMs: 1000,
      battleCount: 10,
      trechoCount: 5,
    };

    const result = await useCase.execute(input);

    expect(repository.insert).toHaveBeenCalledWith(expect.any(Object));
    expect(result).toBeDefined();
    expect(result.projectPath).toBe(input.projectPath);
    expect(result.projectName).toBe(input.projectName);
    expect(result.status).toBe(input.status);
  });

  it('should create entry with default PENDING status', async () => {
    const input = {
      projectPath: '/test/project',
      projectName: 'Test Project',
      ttkVersion: '1.0.0',
      configJson: '{"test": true}',
      summaryJson: '{"summary": "test"}',
      durationMs: 1000,
      battleCount: 10,
      trechoCount: 5,
    };

    const result = await useCase.execute(input);

    expect(result.status).toBe(SimulationStatus.PENDING);
  });

  it('should create entry with RUNNING status', async () => {
    const input = {
      projectPath: '/test/project',
      projectName: 'Test Project',
      status: SimulationStatus.RUNNING,
      ttkVersion: '1.0.0',
      configJson: '{"test": true}',
      summaryJson: '{"summary": "test"}',
      durationMs: 1000,
      battleCount: 10,
      trechoCount: 5,
    };

    const result = await useCase.execute(input);

    expect(result.status).toBe(SimulationStatus.RUNNING);
  });
});
