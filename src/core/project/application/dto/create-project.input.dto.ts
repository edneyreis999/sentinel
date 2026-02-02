import { z } from 'zod';

/**
 * Input DTO for CreateProjectUseCase
 *
 * This is the Application Layer's input boundary (Input Port).
 * It validates incoming data before it reaches the use case.
 */
export const createProjectInputSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  path: z.string().min(1, 'Project path is required'),
  gameVersion: z.string().optional(),
  screenshotPath: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;
