import { UserPreferences } from '../entities';

/**
 * UserPreferencesRepository Port (Output Port)
 *
 * This interface is part of the Dependency Inversion Principle.
 * The Application Layer defines the contract, Infrastructure Layer implements it.
 */
export interface IUserPreferencesRepository {
  /**
   * Find user preferences by userId
   */
  findByUserId(userId: string): Promise<UserPreferences | null>;

  /**
   * Save user preferences (create or update)
   */
  save(prefs: UserPreferences): Promise<void>;

  /**
   * Delete user preferences by userId
   */
  delete(userId: string): Promise<void>;

  /**
   * Check if preferences exist for userId
   */
  exists(userId: string): Promise<boolean>;
}
