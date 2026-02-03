import { z } from 'zod';

/**
 * Zod Schemas for Recent Projects API
 *
 * Request and response schemas for input validation and response serialization.
 */

// Request Schemas
export const CreateRecentProjectBodySchema = z.object({
  path: z.string().min(1, 'Path is required'),
  name: z.string().min(1, 'Name is required').max(255, 'Name cannot exceed 255 characters'),
  gameVersion: z.string().optional(),
  screenshotPath: z.string().optional(),
  trechoCount: z.number().int().nonnegative().optional(),
});

export const ListRecentProjectsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(10).optional(),
  offset: z.coerce.number().int().nonnegative().default(0).optional(),
  nameFilter: z.string().optional(),
  gameVersion: z.string().optional(),
});

export const RemoveRecentProjectParamsSchema = z.object({
  path: z.string().min(1, 'Path is required'),
});

// Response Schemas
export const RecentProjectResponseSchema = z.object({
  id: z.string().uuid(),
  path: z.string(),
  name: z.string(),
  gameVersion: z.string().nullable(),
  screenshotPath: z.string().nullable(),
  trechoCount: z.number().nullable(),
  lastOpenedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const RecentProjectsListResponseSchema = z.object({
  data: z.array(RecentProjectResponseSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    perPage: z.number(),
    lastPage: z.number(),
  }),
});

export const SuccessResponseSchema = z.object({
  success: z.boolean(),
});

// Type exports
export type CreateRecentProjectBody = z.infer<typeof CreateRecentProjectBodySchema>;
export type ListRecentProjectsQuery = z.infer<typeof ListRecentProjectsQuerySchema>;
export type RemoveRecentProjectParams = z.infer<typeof RemoveRecentProjectParamsSchema>;
