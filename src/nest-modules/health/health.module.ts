import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthResolver } from './health.resolver';
import { HealthService } from './health.service';
import { MemoryHealthIndicator } from './indicators/memory-health.indicator';

@Module({
  controllers: [HealthController],
  providers: [HealthService, HealthResolver, MemoryHealthIndicator],
  exports: [HealthService],
})
export class HealthModule {}
