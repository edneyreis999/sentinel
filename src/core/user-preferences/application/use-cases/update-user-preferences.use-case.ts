import { PubSub } from 'graphql-subscriptions';
import { UserPreferences, IUserPreferencesRepository } from '../../domain';
import { UpdateUserPreferencesInput, UserPreferencesOutputDTO } from '../dto';

/**
 * UpdateUserPreferencesUseCase
 *
 * Updates user preferences and publishes events for GraphQL subscriptions.
 * This is the Application Layer's use case for updating preferences.
 *
 * RESPONSIBILITIES:
 * - Fetch or create preferences
 * - Apply changes
 * - Save to repository
 * - Publish PubSub event for subscriptions
 * - Return output via DTO
 */
export class UpdateUserPreferencesUseCase {
  constructor(
    private readonly userPreferencesRepository: IUserPreferencesRepository,
    private readonly pubSub: PubSub,
  ) {}

  async execute(
    input: UpdateUserPreferencesInput,
  ): Promise<ReturnType<typeof UserPreferencesOutputDTO.fromDomain>> {
    let prefs = await this.userPreferencesRepository.findByUserId(input.userId);

    if (!prefs) {
      // Lazy initialization: create defaults if not exists
      prefs = UserPreferences.createDefaults(input.userId);
    }

    // Apply changes
    if (input.theme !== undefined) {
      prefs.changeTheme(input.theme);
    }

    if (input.language !== undefined) {
      prefs.changeLanguage(input.language);
    }

    if (input.windowWidth !== undefined && input.windowHeight !== undefined) {
      prefs.updateWindowDimensions(input.windowWidth, input.windowHeight);
    }

    if (input.windowX !== undefined || input.windowY !== undefined) {
      prefs.updateWindowPosition(
        input.windowX !== undefined ? input.windowX : prefs.windowX,
        input.windowY !== undefined ? input.windowY : prefs.windowY,
      );
    }

    if (input.windowIsMaximized !== undefined) {
      prefs.setWindowMaximized(input.windowIsMaximized);
    }

    if (input.autoSaveInterval !== undefined) {
      prefs.changeAutoSaveInterval(input.autoSaveInterval);
    }

    if (input.maxHistoryEntries !== undefined) {
      prefs.changeMaxHistoryEntries(input.maxHistoryEntries);
    }

    if (input.lastProjectPath !== undefined) {
      prefs.updateLastProjectPath(input.lastProjectPath);
    }

    await this.userPreferencesRepository.save(prefs);

    // Publish PubSub event for GraphQL subscriptions
    const output = UserPreferencesOutputDTO.fromDomain(prefs);
    this.pubSub.publish('userPreferencesChanged', {
      userPreferencesChanged: output,
    });

    return output;
  }
}
