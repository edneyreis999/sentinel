import { z } from 'zod';
import { BadRequestException } from '@nestjs/common';

export function validateInput<T extends z.ZodType>(
  schema: T,
  data: unknown,
  source: 'body' | 'query' | 'params',
): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      source,
    }));

    throw new BadRequestException(errors);
  }

  return result.data;
}
