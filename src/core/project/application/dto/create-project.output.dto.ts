import { z } from 'zod';

/**
 * Output DTO for CreateProjectUseCase
 *
 * This is the Application Layer's output boundary (Output Port).
 * It defines the shape of data returned to the outer layers.
 */
export const createProjectOutputSchema = z.object({
  id: z.string(),
  path: z.string(),
  name: z.string(),
  gameVersion: z.string().nullable(),
  screenshotPath: z.string().nullable(),
  trechoCount: z.number().nullable(),
  lastOpenedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateProjectOutput = z.infer<typeof createProjectOutputSchema>;
