import { Resolver, Query, Mutation, Args, Subscription, ObjectType, Field } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import {
  CREATE_SIMULATION_HISTORY_USE_CASE,
  LIST_SIMULATION_HISTORY_USE_CASE,
  GET_SIMULATION_HISTORY_USE_CASE,
  UPDATE_SIMULATION_STATUS_USE_CASE,
  DELETE_SIMULATION_HISTORY_USE_CASE,
  CreateSimulationHistoryInput,
  SimulationHistoryEntryOutput,
  ListSimulationHistoryInput,
  GetSimulationHistoryInput,
  UpdateSimulationStatusInput,
  DeleteSimulationHistoryInput,
} from '@core/simulation-history/application';
import { SimulationStatus } from '@core/simulation-history/domain';

const pubSub = new PubSub();

/**
 * GraphQL ObjectType decorators for SimulationHistoryEntry
 */
@ObjectType()
class SimulationHistoryEntryGraphQL {
  @Field()
  id(): string {
    return '';
  }

  @Field()
  projectPath(): string {
    return '';
  }

  @Field()
  projectName(): string {
    return '';
  }

  @Field()
  status(): string {
    return '';
  }

  @Field()
  ttkVersion(): string {
    return '';
  }

  @Field()
  configJson(): string {
    return '';
  }

  @Field(() => String, { nullable: true })
  summaryJson(): string {
    return '';
  }

  @Field()
  hasReport(): boolean {
    return false;
  }

  @Field(() => String, { nullable: true })
  reportFilePath(): string {
    return '';
  }

  @Field()
  durationMs(): number {
    return 0;
  }

  @Field()
  battleCount(): number {
    return 0;
  }

  @Field()
  trechoCount(): number {
    return 0;
  }

  @Field()
  timestamp(): Date {
    return new Date();
  }

  @Field()
  createdAt(): Date {
    return new Date();
  }

  @Field()
  updatedAt(): Date {
    return new Date();
  }
}

/**
 * SimulationHistoryResolver
 *
 * GraphQL Resolver for Simulation History Module.
 * Provides Queries, Mutations, and Subscriptions for simulation history.
 */
@Resolver(() => SimulationHistoryEntryGraphQL)
export class SimulationHistoryResolver {
  /* eslint-disable @typescript-eslint/no-explicit-any -- Use case interfaces injected via DI tokens */
  constructor(
    @Inject(CREATE_SIMULATION_HISTORY_USE_CASE)
    private readonly createUseCase: any,
    @Inject(LIST_SIMULATION_HISTORY_USE_CASE)
    private readonly listUseCase: any,
    @Inject(GET_SIMULATION_HISTORY_USE_CASE)
    private readonly getUseCase: any,
    @Inject(UPDATE_SIMULATION_STATUS_USE_CASE)
    private readonly updateStatusUseCase: any,
    @Inject(DELETE_SIMULATION_HISTORY_USE_CASE)
    private readonly deleteUseCase: any,
  ) {}
  /* eslint-enable @typescript-eslint/no-explicit-any */

  @Query(() => [SimulationHistoryEntryGraphQL], {
    description: 'List simulation history entries with optional filters and pagination',
  })
  async simulationHistory(
    @Args('projectPath', { nullable: true }) projectPath?: string,
    @Args('status', { type: () => String, nullable: true }) status?: string,
    @Args('ttkVersion', { nullable: true }) ttkVersion?: string,
    @Args('dateFrom', { type: () => Date, nullable: true }) dateFrom?: Date,
    @Args('dateTo', { type: () => Date, nullable: true }) dateTo?: Date,
    @Args('page', { type: () => Number, nullable: true, defaultValue: 1 }) page?: number,
    @Args('perPage', { type: () => Number, nullable: true, defaultValue: 20 }) perPage?: number,
  ): Promise<SimulationHistoryEntryOutput[]> {
    const input: ListSimulationHistoryInput = {
      filters: {
        projectPath,
        status,
        ttkVersion,
        dateFrom,
        dateTo,
      },
      pagination: { page: page ?? 1, perPage: perPage ?? 20 },
    };

    const result = await this.listUseCase.execute(input);
    return result.items;
  }

  @Query(() => SimulationHistoryEntryGraphQL, {
    description: 'Get a single simulation history entry by ID',
    nullable: true,
  })
  async simulationHistoryEntry(
    @Args('id') id: string,
  ): Promise<SimulationHistoryEntryOutput | null> {
    const input: GetSimulationHistoryInput = { id };
    return await this.getUseCase.execute(input);
  }

  @Mutation(() => SimulationHistoryEntryGraphQL, {
    description: 'Create a new simulation history entry',
  })
  async createSimulationHistoryEntry(
    @Args('projectPath') projectPath: string,
    @Args('projectName') projectName: string,
    @Args('ttkVersion') ttkVersion: string,
    @Args('configJson') configJson: string,
    @Args('durationMs') durationMs: number,
    @Args('battleCount') battleCount: number,
    @Args('trechoCount') trechoCount: number,
    @Args('status', { type: () => String, nullable: true, defaultValue: 'PENDING' })
    status?: string,
    @Args('summaryJson', { nullable: true }) summaryJson?: string,
    @Args('hasReport', { nullable: true, defaultValue: false }) hasReport?: boolean,
    @Args('reportFilePath', { nullable: true }) reportFilePath?: string,
  ): Promise<SimulationHistoryEntryOutput> {
    const input: CreateSimulationHistoryInput = {
      projectPath,
      projectName,
      status: status as SimulationStatus,
      ttkVersion,
      configJson,
      summaryJson,
      hasReport,
      reportFilePath,
      durationMs,
      battleCount,
      trechoCount,
    };

    const result = await this.createUseCase.execute(input);

    // Publish subscription event
    pubSub.publish('SIMULATION_HISTORY_CHANGED', { simulationHistoryChanged: result });

    return result;
  }

  @Mutation(() => SimulationHistoryEntryGraphQL, {
    description: 'Update simulation status with state machine validation',
  })
  async updateSimulationStatus(
    @Args('id') id: string,
    @Args('status', { type: () => String }) status: string,
    @Args('summaryJson', { nullable: true }) summaryJson?: string,
  ): Promise<SimulationHistoryEntryOutput> {
    const input: UpdateSimulationStatusInput = {
      id,
      status: status as SimulationStatus,
      summaryJson,
    };

    const result = await this.updateStatusUseCase.execute(input);

    // Publish subscription events
    pubSub.publish('SIMULATION_STATUS_CHANGED', {
      simulationStatusChanged: result,
      simulationId: id,
    });
    pubSub.publish('SIMULATION_HISTORY_CHANGED', { simulationHistoryChanged: result });

    return result;
  }

  @Mutation(() => Boolean, {
    description: 'Delete a simulation history entry',
  })
  async deleteSimulationHistory(@Args('id') id: string): Promise<boolean> {
    const input: DeleteSimulationHistoryInput = { id };
    await this.deleteUseCase.execute(input);
    return true;
  }

  /* eslint-disable @typescript-eslint/no-explicit-any -- GraphQL Subscription/PubSub typing limitations */
  @Subscription(() => SimulationHistoryEntryGraphQL, {
    name: 'simulationStatusChanged',
    resolve: (payload: any) => payload.simulationStatusChanged,
    filter: (payload: any, variables: any) => {
      if (!variables.simulationId) return true;
      return payload.simulationId === variables.simulationId;
    },
  })
  simulationStatusChanged(
    @Args('simulationId', { type: () => String, nullable: true }) _simulationId?: string,
  ): AsyncIterator<any> {
    return (pubSub as any).asyncIterableIterator(['SIMULATION_STATUS_CHANGED']);
  }

  @Subscription(() => SimulationHistoryEntryGraphQL, {
    name: 'simulationHistoryChanged',
    resolve: (payload: any) => payload.simulationHistoryChanged,
  })
  simulationHistoryChanged(): AsyncIterator<any> {
    return (pubSub as any).asyncIterableIterator(['SIMULATION_HISTORY_CHANGED']);
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
