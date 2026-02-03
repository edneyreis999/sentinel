/**
 * Dependency Injection Tokens for Recent Projects Module
 *
 * Using Symbol tokens prevents string collision issues and provides
 * type-safe dependency injection in NestJS.
 */

export const IRecentProjectsRepositoryToken = Symbol('IRecentProjectsRepository');
export const ICreateRecentProjectUseCaseToken = Symbol('ICreateRecentProjectUseCase');
export const IListRecentProjectsUseCaseToken = Symbol('IListRecentProjectsUseCase');
export const IRemoveRecentProjectUseCaseToken = Symbol('IRemoveRecentProjectUseCase');
