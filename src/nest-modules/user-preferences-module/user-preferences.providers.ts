import { PrismaService } from '@database';
import { PubSub } from 'graphql-subscriptions';
import {
  USER_PREFERENCES_REPOSITORY,
  GET_USER_PREFERENCES_USE_CASE,
  UPDATE_USER_PREFERENCES_USE_CASE,
  GetUserPreferencesUseCase,
  UpdateUserPreferencesUseCase,
} from '@core/user-preferences/application';
import { IUserPreferencesRepository } from '@core/user-preferences/domain';
import { UserPreferencesPrismaRepository } from '@core/user-preferences/infra';

/**
 * Dependency Injection Providers for UserPreferences Module
 *
 * Configures all providers following Clean Architecture principles.
 */
export const USER_PREFERENCES_PROVIDERS = [
  {
    provide: USER_PREFERENCES_REPOSITORY,
    useFactory: (prisma: PrismaService) => new UserPreferencesPrismaRepository(prisma),
    inject: [PrismaService],
  },
  {
    provide: 'PUB_SUB',
    useFactory: () => new PubSub(),
  },
  {
    provide: GET_USER_PREFERENCES_USE_CASE,
    useFactory: (repository: IUserPreferencesRepository) =>
      new GetUserPreferencesUseCase(repository),
    inject: [USER_PREFERENCES_REPOSITORY],
  },
  {
    provide: UPDATE_USER_PREFERENCES_USE_CASE,
    useFactory: (repository: IUserPreferencesRepository, pubSub: PubSub) =>
      new UpdateUserPreferencesUseCase(repository, pubSub),
    inject: [USER_PREFERENCES_REPOSITORY, 'PUB_SUB'],
  },
];
