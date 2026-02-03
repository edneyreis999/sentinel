import { Resolver, Query } from '@nestjs/graphql';
import { HealthService } from './health.service';
import { HealthStatus } from './types/health-status.types';

@Resolver(() => HealthStatus)
export class HealthResolver {
  constructor(private readonly service: HealthService) {}

  @Query(() => HealthStatus, {
    name: 'health',
    description: 'Returns the current health status of the application',
  })
  getStatus(): HealthStatus {
    return this.service.getStatus();
  }
}
