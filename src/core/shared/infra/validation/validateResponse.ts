import { z } from 'zod';
import { InternalServerErrorException } from '@nestjs/common';

export function validateResponse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    console.error('Response validation failed:', result.error);
    throw new InternalServerErrorException('Response validation failed');
  }

  return result.data;
}
