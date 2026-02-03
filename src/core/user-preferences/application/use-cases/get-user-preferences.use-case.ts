import { UserPreferences, IUserPreferencesRepository } from '../../domain';
import { GetUserPreferencesInput, UserPreferencesOutputDTO } from '../dto';

/**
 * GetUserPreferencesUseCase
 *
 * Retrieves user preferences with lazy initialization of defaults.
 * This is the Application Layer's use case for getting preferences.
 *
 * RESPONSIBILITIES:
 * - Fetch preferences from repository
 * - Create default preferences if not exists (lazy initialization)
 * - Return output via DTO
 */
export class GetUserPreferencesUseCase {
  constructor(private readonly userPreferencesRepository: IUserPreferencesRepository) {}

  async execute(
    input: GetUserPreferencesInput,
  ): Promise<ReturnType<typeof UserPreferencesOutputDTO.fromDomain>> {
    const prefs = await this.userPreferencesRepository.findByUserId(input.userId);

    if (!prefs) {
      // Lazy initialization: create defaults if not exists
      const defaultPrefs = UserPreferences.createDefaults(input.userId);
      await this.userPreferencesRepository.save(defaultPrefs);
      return UserPreferencesOutputDTO.fromDomain(defaultPrefs);
    }

    return UserPreferencesOutputDTO.fromDomain(prefs);
  }
}
