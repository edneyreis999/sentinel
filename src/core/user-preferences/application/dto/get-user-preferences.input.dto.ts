import { z } from 'zod';

/**
 * Input DTO for GetUserPreferencesUseCase
 */
export const getUserPreferencesInputSchema = z.object({
  userId: z.string().default('default'),
});

export type GetUserPreferencesInput = z.infer<typeof getUserPreferencesInputSchema>;
