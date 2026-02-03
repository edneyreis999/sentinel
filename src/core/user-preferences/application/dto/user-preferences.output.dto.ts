import { z } from 'zod';
import type { UserPreferences } from '../../domain/entities/user-preferences.aggregate';

/**
 * Output DTO for UserPreferences operations
 *
 * This factory method creates output DTOs from domain entities.
 * It follows the Factory pattern for DTO creation.
 */
export const userPreferencesOutputSchema = z.object({
  id: z.string(),
  userId: z.string(),
  theme: z.enum(['LIGHT', 'DARK', 'SYSTEM']),
  language: z.string(),
  windowWidth: z.number(),
  windowHeight: z.number(),
  windowX: z.number().nullable(),
  windowY: z.number().nullable(),
  windowIsMaximized: z.boolean(),
  autoSaveInterval: z.number(),
  maxHistoryEntries: z.number(),
  lastProjectPath: z.string().nullable(),
  lastOpenDate: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserPreferencesOutput = z.infer<typeof userPreferencesOutputSchema>;

/**
 * Factory class for creating UserPreferencesOutputDTO
 */
export class UserPreferencesOutputDTO {
  static readonly schema = userPreferencesOutputSchema;

  static fromDomain(entity: UserPreferences): UserPreferencesOutput {
    const output = {
      id: entity.id.value,
      userId: entity.userId,
      theme: entity.theme,
      language: entity.language,
      windowWidth: entity.windowWidth,
      windowHeight: entity.windowHeight,
      windowX: entity.windowX,
      windowY: entity.windowY,
      windowIsMaximized: entity.windowIsMaximized,
      autoSaveInterval: entity.autoSaveInterval,
      maxHistoryEntries: entity.maxHistoryEntries,
      lastProjectPath: entity.lastProjectPath,
      lastOpenDate: entity.lastOpenDate,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };

    return this.schema.parse(output);
  }

  static validate(data: unknown): UserPreferencesOutput {
    return this.schema.parse(data);
  }
}
