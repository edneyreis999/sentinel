import { UpdateUserPreferencesUseCase } from '../use-cases/update-user-preferences.use-case';
import { UserPreferencesInMemoryRepository } from '@core/user-preferences/infra';
import { UserPreferences } from '@core/user-preferences/domain';

/**
 * Fake implementation of PubSub for testing
 * Avoids using jest.spyOn and provides better test isolation
 */
class PubSubFake {
  public publishedEvents: Array<{ event: string; data: unknown }> = [];

  async publish(event: string, data: unknown): Promise<void> {
    this.publishedEvents.push({ event, data });
  }

  /**
   * Helper method to check if an event was published
   */
  wasEventPublished(event: string): boolean {
    return this.publishedEvents.some((e) => e.event === event);
  }

  /**
   * Helper method to get data for a specific event
   */
  getEventData(event: string): unknown | undefined {
    return this.publishedEvents.find((e) => e.event === event)?.data;
  }

  /**
   * Reset published events between tests
   */
  reset(): void {
    this.publishedEvents = [];
  }
}

describe('UpdateUserPreferencesUseCase', () => {
  let useCase: UpdateUserPreferencesUseCase;
  let repository: UserPreferencesInMemoryRepository;
  let pubSub: PubSubFake;

  beforeEach(() => {
    repository = new UserPreferencesInMemoryRepository();
    pubSub = new PubSubFake();
    useCase = new UpdateUserPreferencesUseCase(repository, pubSub as any);
  });

  it('should update existing preferences', async () => {
    const prefs = UserPreferences.createDefaults('user-1');
    await repository.save(prefs);

    const output = await useCase.execute({
      userId: 'user-1',
      theme: 'DARK',
      language: 'en-US',
    });

    expect(output.theme).toBe('DARK');
    expect(output.language).toBe('en-US');
  });

  it('should create default preferences when not exist (lazy initialization)', async () => {
    const output = await useCase.execute({
      userId: 'new-user',
      theme: 'LIGHT',
    });

    expect(output.userId).toBe('new-user');
    expect(output.theme).toBe('LIGHT');
  });

  it('should update window dimensions', async () => {
    const prefs = UserPreferences.createDefaults('user-1');
    await repository.save(prefs);

    const output = await useCase.execute({
      userId: 'user-1',
      windowWidth: 1920,
      windowHeight: 1080,
    });

    expect(output.windowWidth).toBe(1920);
    expect(output.windowHeight).toBe(1080);
  });

  it('should update auto save interval', async () => {
    const prefs = UserPreferences.createDefaults('user-1');
    await repository.save(prefs);

    const output = await useCase.execute({
      userId: 'user-1',
      autoSaveInterval: 60000,
    });

    expect(output.autoSaveInterval).toBe(60000);
  });

  it('should publish PubSub event', async () => {
    const prefs = UserPreferences.createDefaults('user-1');
    await repository.save(prefs);

    await useCase.execute({
      userId: 'user-1',
      theme: 'DARK',
    });

    expect(pubSub.wasEventPublished('userPreferencesChanged')).toBe(true);
    expect(pubSub.getEventData('userPreferencesChanged')).toMatchObject({
      userPreferencesChanged: expect.objectContaining({
        userId: 'user-1',
        theme: 'DARK',
      }),
    });
  });

  it('should update last project path and set lastOpenDate', async () => {
    const prefs = UserPreferences.createDefaults('user-1');
    await repository.save(prefs);

    const output = await useCase.execute({
      userId: 'user-1',
      lastProjectPath: '/new/path',
    });

    expect(output.lastProjectPath).toBe('/new/path');
    expect(output.lastOpenDate).toBeInstanceOf(Date);
  });
});
