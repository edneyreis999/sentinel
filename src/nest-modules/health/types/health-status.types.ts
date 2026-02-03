import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsString, IsNumber } from 'class-validator';

export enum HealthStatusEnum {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  UNHEALTHY = 'UNHEALTHY',
}

registerEnumType(HealthStatusEnum, {
  name: 'HealthStatusEnum',
  description: 'The health status of the application',
});

@ObjectType()
export class HealthStatus {
  @Field(() => HealthStatusEnum, {
    description: 'The current health status of the application',
  })
  @IsEnum(HealthStatusEnum)
  status!: HealthStatusEnum;

  @Field(() => String, {
    description: 'The version of the application',
  })
  @IsString()
  version!: string;

  @Field(() => Number, {
    description: 'The uptime of the application in seconds',
  })
  @IsNumber()
  uptime!: number;

  @Field(() => Date, {
    description: 'The current timestamp',
  })
  timestamp!: Date;
}
