import { z } from 'zod';

/**
 * Common test schemas used across validation E2E tests
 * Extracted to avoid duplication (General Fixture anti-pattern)
 */
export const TEST_SCHEMAS = {
  user: z.object({
    name: z.string().min(3),
    email: z.string().email(),
    age: z.number().min(0).max(120).optional(),
  }),

  registration: z.object({
    username: z.string().min(3).max(30),
    email: z.string().email(),
    password: z
      .string()
      .min(8)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    age: z.number().min(13).max(120),
  }),

  nestedUser: z.object({
    user: z.object({
      name: z.string().min(3),
      email: z.string().email(),
    }),
  }),

  numberData: z.object({
    count: z.number(),
    price: z.number().positive(),
  }),

  arrayData: z.object({
    tags: z.array(z.string()).min(1),
  }),

  response: z.object({
    success: z.boolean(),
    data: z.object({
      id: z.string(),
      name: z.string(),
    }),
    timestamp: z.string().datetime(),
  }),

  nestedResponse: z.object({
    user: z.object({
      profile: z.object({
        name: z.string(),
        age: z.number(),
      }),
    }),
  }),

  arrayResponse: z.object({
    items: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
      }),
    ),
  }),

  search: z.object({
    q: z.string().min(1),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(10),
    sort: z.enum(['relevance', 'date', 'name']).default('relevance'),
  }),

  paginatedResponse: z.object({
    data: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
      }),
    ),
    meta: z.object({
      total: z.number(),
      page: z.number(),
      limit: z.number(),
      totalPages: z.number(),
    }),
  }),

  complexPassword: z.object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain uppercase letter')
      .regex(/[a-z]/, 'Password must contain lowercase letter')
      .regex(/\d/, 'Password must contain number'),
  }),

  typedData: z.object({
    name: z.string(),
    count: z.number(),
    active: z.boolean(),
  }),

  union: z.object({
    status: z.union([z.literal('active'), z.literal('inactive'), z.literal('pending')]),
  }),

  nullable: z.object({
    optional: z.string().optional(),
    nullable: z.string().nullable(),
  }),

  minLength: z.object({
    name: z.string().min(1),
  }),

  noWhitespace: z.object({
    name: z
      .string()
      .min(1)
      .regex(/^\S.*\S$|^\S$/, 'Must not be whitespace-only'),
  }),

  maxLength: z.object({
    description: z.string().max(500),
  }),
} as const;
