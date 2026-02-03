import { Module } from '@nestjs/common';
import { RecentProjectsResolver } from './recent-projects.resolver';
import { recentProjectsProviders } from './recent-projects.providers';
import { PrismaModule } from '@database';

/**
 * RecentProjects Module
 *
 * NestJS module that encapsulates the Recent Projects feature.
 * Imports PrismaModule for database access.
 * Exports the Resolver for use in AppModule.
 */
@Module({
  imports: [PrismaModule],
  providers: [...recentProjectsProviders, RecentProjectsResolver],
  exports: [RecentProjectsResolver],
})
export class RecentProjectsModule {}
