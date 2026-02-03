import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthStatus } from './types/health-status.types';

@Controller()
export class HealthController {
  constructor(private readonly service: HealthService) {}

  @Get('health')
  getHealth(): HealthStatus {
    return this.service.getStatus();
  }
}
