import { z } from 'zod';

/**
 * Zod schemas for UserPreferences HTTP requests
 */
export const updateUserPreferencesSchema = z.object({
  theme: z.enum(['LIGHT', 'DARK', 'SYSTEM']).optional(),
  language: z.string().optional(),
  windowWidth: z.number().int().positive().optional(),
  windowHeight: z.number().int().positive().optional(),
  windowX: z.number().int().nullable().optional(),
  windowY: z.number().int().nullable().optional(),
  windowIsMaximized: z.boolean().optional(),
  autoSaveInterval: z.number().int().min(5000).optional(),
  maxHistoryEntries: z.number().int().min(1).max(1000).optional(),
  lastProjectPath: z.string().nullable().optional(),
});

export type UpdateUserPreferencesRequest = z.infer<typeof updateUserPreferencesSchema>;
