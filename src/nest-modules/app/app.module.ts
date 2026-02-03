import { Module } from '@nestjs/common';
import { AppResolver } from './app.resolver';
import { RecentProjectsModule } from '../recent-projects-module/recent-projects.module';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [RecentProjectsModule, PrismaModule],
  providers: [AppResolver],
})
export class AppModule {}
