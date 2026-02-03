import { UpdateUserPreferencesUseCase } from '../use-cases/update-user-preferences.use-case';
import { PubSub } from 'graphql-subscriptions';
import { UserPreferencesInMemoryRepository } from '@core/user-preferences/infra';
import { UserPreferences } from '@core/user-preferences/domain';

describe('UpdateUserPreferencesUseCase', () => {
  let useCase: UpdateUserPreferencesUseCase;
  let repository: UserPreferencesInMemoryRepository;
  let pubSub: PubSub;

  beforeEach(() => {
    repository = new UserPreferencesInMemoryRepository();
    pubSub = new PubSub();
    useCase = new UpdateUserPreferencesUseCase(repository, pubSub);
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

    const spy = jest.spyOn(pubSub, 'publish');

    await useCase.execute({
      userId: 'user-1',
      theme: 'DARK',
    });

    expect(spy).toHaveBeenCalledWith('userPreferencesChanged', {
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
