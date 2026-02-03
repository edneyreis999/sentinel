import { Resolver, Query, Mutation, Subscription, Args } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import {
  GET_USER_PREFERENCES_USE_CASE,
  UPDATE_USER_PREFERENCES_USE_CASE,
  GetUserPreferencesUseCase,
  UpdateUserPreferencesUseCase,
} from '@core/user-preferences/application';
import { UserPreferencesPresenter } from '../presenters/user-preferences.presenter';
import { UserPreferencesGraphQL, ThemeMode } from '../models/user-preferences.model';

/**
 * UserPreferencesResolver
 *
 * GraphQL resolver for UserPreferences operations.
 * Provides Queries, Mutations, and Subscriptions.
 */
@Resolver(() => UserPreferencesGraphQL)
export class UserPreferencesResolver {
  constructor(
    @Inject(GET_USER_PREFERENCES_USE_CASE)
    private readonly getPreferencesUseCase: GetUserPreferencesUseCase,
    @Inject(UPDATE_USER_PREFERENCES_USE_CASE)
    private readonly updatePreferencesUseCase: UpdateUserPreferencesUseCase,
    @Inject('PUB_SUB')
    private readonly pubSub: PubSub,
  ) {}

  @Query(() => UserPreferencesGraphQL, {
    description: 'Get user preferences with lazy initialization of defaults',
  })
  async userPreferences(): Promise<Record<string, unknown>> {
    const output = await this.getPreferencesUseCase.execute({ userId: 'default' });
    return UserPreferencesPresenter.toGraphQL(output);
  }

  @Mutation(() => UserPreferencesGraphQL, {
    description: 'Update user preferences',
  })
  async updateUserPreferences(
    @Args('theme', { type: () => ThemeMode, nullable: true }) theme?: ThemeMode,
    @Args('language', { nullable: true }) language?: string,
    @Args('windowWidth', { nullable: true }) windowWidth?: number,
    @Args('windowHeight', { nullable: true }) windowHeight?: number,
    @Args('windowX', { nullable: true }) windowX?: number,
    @Args('windowY', { nullable: true }) windowY?: number,
    @Args('windowIsMaximized', { nullable: true }) windowIsMaximized?: boolean,
    @Args('autoSaveInterval', { nullable: true }) autoSaveInterval?: number,
    @Args('maxHistoryEntries', { nullable: true }) maxHistoryEntries?: number,
    @Args('lastProjectPath', { nullable: true }) lastProjectPath?: string,
  ): Promise<Record<string, unknown>> {
    const output = await this.updatePreferencesUseCase.execute({
      userId: 'default',
      theme,
      language,
      windowWidth,
      windowHeight,
      windowX,
      windowY,
      windowIsMaximized,
      autoSaveInterval,
      maxHistoryEntries,
      lastProjectPath,
    });

    return UserPreferencesPresenter.toGraphQL(output);
  }

  @Subscription(() => UserPreferencesGraphQL, {
    description: 'Subscribe to user preferences changes',
    resolve: (payload: { userPreferencesChanged: Record<string, unknown> }) =>
      payload.userPreferencesChanged,
  })
  userPreferencesChanged(): AsyncIterator<Record<string, unknown>> {
    return (
      this.pubSub as PubSub & {
        asyncIterableIterator: (events: string[]) => AsyncIterator<Record<string, unknown>>;
      }
    ).asyncIterableIterator(['userPreferencesChanged']);
  }
}
