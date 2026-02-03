import { UserPreferences, IUserPreferencesRepository } from '../../../domain';

/**
 * UserPreferencesInMemoryRepository
 *
 * In-memory implementation for testing.
 * Uses a Map to store preferences by userId.
 */
export class UserPreferencesInMemoryRepository implements IUserPreferencesRepository {
  private readonly items: Map<string, UserPreferences> = new Map();

  async findByUserId(userId: string): Promise<UserPreferences | null> {
    return this.items.get(userId) || null;
  }

  async save(prefs: UserPreferences): Promise<void> {
    this.items.set(prefs.userId, prefs);
  }

  async delete(userId: string): Promise<void> {
    this.items.delete(userId);
  }

  async exists(userId: string): Promise<boolean> {
    return this.items.has(userId);
  }

  /**
   * Helper method for testing - clear all items
   */
  clear(): void {
    this.items.clear();
  }

  /**
   * Helper method for testing - get all items
   */
  getAll(): UserPreferences[] {
    return Array.from(this.items.values());
  }
}
