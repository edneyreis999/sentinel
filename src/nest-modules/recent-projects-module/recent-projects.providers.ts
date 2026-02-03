import { Provider } from '@nestjs/common';

// Concrete implementations
import { RecentProjectsPrismaRepository } from '@core/recent-projects/infra/db/prisma/recent-projects-prisma.repository';
import { CreateRecentProjectUseCase } from '@core/recent-projects/application/use-cases/create/create-recent-project.use-case';
import { ListRecentProjectsUseCase } from '@core/recent-projects/application/use-cases/list/list-recent-projects.use-case';
import { RemoveRecentProjectUseCase } from '@core/recent-projects/application/use-cases/remove/remove-recent-project.use-case';

// DI Tokens
import {
  IRecentProjectsRepositoryToken,
  ICreateRecentProjectUseCaseToken,
  IListRecentProjectsUseCaseToken,
  IRemoveRecentProjectUseCaseToken,
} from '@core/recent-projects/application/ports/tokens';

// Import PrismaService for repository factory
import { PrismaService } from '@database';

/**
 * Dependency Injection Providers for Recent Projects Module
 *
 * Uses Symbol tokens for type-safe DI with interfaces.
 * All providers use useFactory pattern for explicit dependency injection.
 */

// Repository Provider
export const RecentProjectsRepositoryProvider: Provider = {
  provide: IRecentProjectsRepositoryToken,
  useFactory: (prismaService: PrismaService) => {
    return new RecentProjectsPrismaRepository(prismaService);
  },
  inject: [PrismaService],
};

// Create Use Case Provider
export const CreateRecentProjectUseCaseProvider: Provider = {
  provide: ICreateRecentProjectUseCaseToken,
  useFactory: (repository: IRecentProjectsRepository) => {
    return new CreateRecentProjectUseCase(repository);
  },
  inject: [IRecentProjectsRepositoryToken],
};

// List Use Case Provider
export const ListRecentProjectsUseCaseProvider: Provider = {
  provide: IListRecentProjectsUseCaseToken,
  useFactory: (repository: IRecentProjectsRepository) => {
    return new ListRecentProjectsUseCase(repository);
  },
  inject: [IRecentProjectsRepositoryToken],
};

// Remove Use Case Provider
export const RemoveRecentProjectUseCaseProvider: Provider = {
  provide: IRemoveRecentProjectUseCaseToken,
  useFactory: (repository: IRecentProjectsRepository) => {
    return new RemoveRecentProjectUseCase(repository);
  },
  inject: [IRecentProjectsRepositoryToken],
};

// Export all providers
export const recentProjectsProviders = [
  RecentProjectsRepositoryProvider,
  CreateRecentProjectUseCaseProvider,
  ListRecentProjectsUseCaseProvider,
  RemoveRecentProjectUseCaseProvider,
];
