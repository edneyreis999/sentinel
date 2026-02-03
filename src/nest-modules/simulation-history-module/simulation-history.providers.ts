import { PrismaService } from '@database';
import {
  SIMULATION_HISTORY_REPOSITORY,
  CREATE_SIMULATION_HISTORY_USE_CASE,
  LIST_SIMULATION_HISTORY_USE_CASE,
  GET_SIMULATION_HISTORY_USE_CASE,
  UPDATE_SIMULATION_STATUS_USE_CASE,
  DELETE_SIMULATION_HISTORY_USE_CASE,
} from '@core/simulation-history/application';
import { ISimulationHistoryRepository } from '@core/simulation-history/domain';
import { SimulationHistoryPrismaRepository } from '@core/simulation-history/infra';
import { CreateSimulationHistoryUseCase } from '@core/simulation-history/application/use-cases';
import { ListSimulationHistoryUseCase } from '@core/simulation-history/application/use-cases';
import { GetSimulationHistoryUseCase } from '@core/simulation-history/application/use-cases';
import { UpdateSimulationStatusUseCase } from '@core/simulation-history/application/use-cases';
import { DeleteSimulationHistoryUseCase } from '@core/simulation-history/application/use-cases';

/**
 * Providers for Simulation History Module
 *
 * Centralized provider configuration following DI Token pattern (ADR-DI-001)
 */
export const SIMULATION_HISTORY_PROVIDERS = [
  {
    provide: SIMULATION_HISTORY_REPOSITORY,
    useFactory: (prisma: PrismaService) => new SimulationHistoryPrismaRepository(prisma),
    inject: [PrismaService],
  },
  {
    provide: CREATE_SIMULATION_HISTORY_USE_CASE,
    useFactory: (repository: ISimulationHistoryRepository) =>
      new CreateSimulationHistoryUseCase(repository),
    inject: [SIMULATION_HISTORY_REPOSITORY],
  },
  {
    provide: LIST_SIMULATION_HISTORY_USE_CASE,
    useFactory: (repository: ISimulationHistoryRepository) =>
      new ListSimulationHistoryUseCase(repository),
    inject: [SIMULATION_HISTORY_REPOSITORY],
  },
  {
    provide: GET_SIMULATION_HISTORY_USE_CASE,
    useFactory: (repository: ISimulationHistoryRepository) =>
      new GetSimulationHistoryUseCase(repository),
    inject: [SIMULATION_HISTORY_REPOSITORY],
  },
  {
    provide: UPDATE_SIMULATION_STATUS_USE_CASE,
    useFactory: (repository: ISimulationHistoryRepository) =>
      new UpdateSimulationStatusUseCase(repository),
    inject: [SIMULATION_HISTORY_REPOSITORY],
  },
  {
    provide: DELETE_SIMULATION_HISTORY_USE_CASE,
    useFactory: (repository: ISimulationHistoryRepository) =>
      new DeleteSimulationHistoryUseCase(repository),
    inject: [SIMULATION_HISTORY_REPOSITORY],
  },
];
