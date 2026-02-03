import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';

// Type-only imports for interfaces
import type { ICreateRecentProjectUseCase } from '@core/recent-projects/application/ports/in/ICreateRecentProjectUseCase';
import type { IListRecentProjectsUseCase } from '@core/recent-projects/application/ports/in/IListRecentProjectsUseCase';
import type { IRemoveRecentProjectUseCase } from '@core/recent-projects/application/ports/in/IRemoveRecentProjectUseCase';

// DI Tokens
import { Inject } from '@nestjs/common';
import {
  ICreateRecentProjectUseCaseToken,
  IListRecentProjectsUseCaseToken,
  IRemoveRecentProjectUseCaseToken,
} from '@core/recent-projects/application/ports/tokens';

// Presenter
import { RecentProjectsPresenter } from './recent-projects.presenter';

// GraphQL Types
import { RecentProject } from './models/recent-project.model';
import { PaginatedRecentProjects } from './models/paginated-recent-projects.model';
import { SuccessResponse } from './models/success-response.model';

/**
 * RecentProjects GraphQL Resolver
 *
 * Handles GraphQL queries and mutations for recent projects.
 * Depends only on Input Ports (interfaces), not concrete implementations.
 */
@Resolver(() => RecentProject)
export class RecentProjectsResolver {
  constructor(
    @Inject(ICreateRecentProjectUseCaseToken)
    private readonly createUseCase: ICreateRecentProjectUseCase,

    @Inject(IListRecentProjectsUseCaseToken)
    private readonly listUseCase: IListRecentProjectsUseCase,

    @Inject(IRemoveRecentProjectUseCaseToken)
    private readonly removeUseCase: IRemoveRecentProjectUseCase,
  ) {}

  @Query(() => PaginatedRecentProjects, { name: 'recentProjects' })
  async findAll(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 })
    limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 })
    offset: number,
    @Args('nameFilter', { nullable: true })
    nameFilter?: string,
    @Args('gameVersion', { nullable: true })
    gameVersion?: string,
  ) {
    const result = await this.listUseCase.execute({
      limit,
      offset,
      nameFilter,
      gameVersion,
    });

    return RecentProjectsPresenter.toPaginatedHttp(result);
  }

  @Mutation(() => RecentProject, { name: 'addRecentProject' })
  async addRecentProject(
    @Args('path') path: string,
    @Args('name') name: string,
    @Args('gameVersion', { nullable: true })
    gameVersion?: string,
    @Args('screenshotPath', { nullable: true })
    screenshotPath?: string,
    @Args('trechoCount', { type: () => Int, nullable: true })
    trechoCount?: number,
  ) {
    const result = await this.createUseCase.execute({
      path,
      name,
      gameVersion,
      screenshotPath,
      trechoCount,
    });

    return RecentProjectsPresenter.toHttp(result);
  }

  @Mutation(() => SuccessResponse, { name: 'removeRecentProject' })
  async removeRecentProject(@Args('path') path: string) {
    await this.removeUseCase.execute({ path });

    return RecentProjectsPresenter.toSuccess();
  }
}
