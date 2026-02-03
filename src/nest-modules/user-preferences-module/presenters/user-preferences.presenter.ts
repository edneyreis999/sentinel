import { UserPreferencesOutput } from '@core/user-preferences/application';

/**
 * UserPreferencesPresenter
 *
 * Transforms OutputDTOs to HTTP response format.
 */
export class UserPreferencesPresenter {
  static toHTTP(output: UserPreferencesOutput): Record<string, unknown> {
    return {
      id: output.id,
      userId: output.userId,
      theme: output.theme,
      language: output.language,
      windowWidth: output.windowWidth,
      windowHeight: output.windowHeight,
      windowX: output.windowX,
      windowY: output.windowY,
      windowIsMaximized: output.windowIsMaximized,
      autoSaveInterval: output.autoSaveInterval,
      maxHistoryEntries: output.maxHistoryEntries,
      lastProjectPath: output.lastProjectPath,
      lastOpenDate: output.lastOpenDate?.toISOString() || null,
      createdAt: output.createdAt.toISOString(),
      updatedAt: output.updatedAt.toISOString(),
    };
  }

  static toGraphQL(output: UserPreferencesOutput): Record<string, unknown> {
    return {
      id: output.id,
      userId: output.userId,
      theme: output.theme,
      language: output.language,
      windowWidth: output.windowWidth,
      windowHeight: output.windowHeight,
      windowX: output.windowX,
      windowY: output.windowY,
      windowIsMaximized: output.windowIsMaximized,
      autoSaveInterval: output.autoSaveInterval,
      maxHistoryEntries: output.maxHistoryEntries,
      lastProjectPath: output.lastProjectPath,
      lastOpenDate: output.lastOpenDate,
      createdAt: output.createdAt,
      updatedAt: output.updatedAt,
    };
  }
}
