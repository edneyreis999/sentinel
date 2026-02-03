import { Module } from '@nestjs/common';
import { SimulationHistoryResolver } from './simulation-history.resolver';
import { SIMULATION_HISTORY_PROVIDERS } from './simulation-history.providers';

/**
 * SimulationHistoryModule
 *
 * NestJS Module for Simulation History feature.
 * Configures providers and resolvers following Clean Architecture.
 */
@Module({
  imports: [],
  providers: [...SIMULATION_HISTORY_PROVIDERS, SimulationHistoryResolver],
  exports: [],
})
export class SimulationHistoryModule {}
