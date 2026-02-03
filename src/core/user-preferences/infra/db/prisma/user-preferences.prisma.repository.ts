import { PrismaService } from '@database';
import { UserPreferences, IUserPreferencesRepository } from '../../../domain';

/**
 * UserPreferencesPrismaRepository
 *
 * Prisma implementation of the UserPreferences repository.
 * Maps between Prisma models and Domain entities.
 */
export class UserPreferencesPrismaRepository implements IUserPreferencesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<UserPreferences | null> {
    const model = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!model) {
      return null;
    }

    return this.toDomain(model);
  }

  async save(prefs: UserPreferences): Promise<void> {
    const data = prefs.toJSON();

    await this.prisma.userPreferences.upsert({
      where: { userId: prefs.userId },
      create: {
        id: data.id,
        userId: data.userId,
        theme: data.theme,
        language: data.language,
        windowWidth: data.windowWidth,
        windowHeight: data.windowHeight,
        windowX: data.windowX,
        windowY: data.windowY,
        windowIsMaximized: data.windowIsMaximized,
        autoSaveInterval: data.autoSaveInterval,
        maxHistoryEntries: data.maxHistoryEntries,
        lastProjectPath: data.lastProjectPath,
        lastOpenDate: data.lastOpenDate,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      update: {
        theme: data.theme,
        language: data.language,
        windowWidth: data.windowWidth,
        windowHeight: data.windowHeight,
        windowX: data.windowX,
        windowY: data.windowY,
        windowIsMaximized: data.windowIsMaximized,
        autoSaveInterval: data.autoSaveInterval,
        maxHistoryEntries: data.maxHistoryEntries,
        lastProjectPath: data.lastProjectPath,
        lastOpenDate: data.lastOpenDate,
        updatedAt: data.updatedAt,
      },
    });
  }

  async delete(userId: string): Promise<void> {
    await this.prisma.userPreferences.delete({
      where: { userId },
    });
  }

  async exists(userId: string): Promise<boolean> {
    const count = await this.prisma.userPreferences.count({
      where: { userId },
    });
    return count > 0;
  }

  /**
   * Map Prisma model to Domain entity
   */
  private toDomain(model: {
    id: string;
    userId: string;
    theme: string;
    language: string;
    windowWidth: number;
    windowHeight: number;
    windowX: number | null;
    windowY: number | null;
    windowIsMaximized: boolean;
    autoSaveInterval: number;
    maxHistoryEntries: number;
    lastProjectPath: string | null;
    lastOpenDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserPreferences {
    return UserPreferences.create({
      id: model.id,
      userId: model.userId,
      theme: model.theme,
      language: model.language,
      windowWidth: model.windowWidth,
      windowHeight: model.windowHeight,
      windowX: model.windowX,
      windowY: model.windowY,
      windowIsMaximized: model.windowIsMaximized,
      autoSaveInterval: model.autoSaveInterval,
      maxHistoryEntries: model.maxHistoryEntries,
      lastProjectPath: model.lastProjectPath,
      lastOpenDate: model.lastOpenDate,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }
}
