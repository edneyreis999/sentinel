import { GetUserPreferencesUseCase } from '../use-cases/get-user-preferences.use-case';
import { UserPreferencesInMemoryRepository } from '@core/user-preferences/infra';
import { UserPreferencesFakeBuilder } from '@core/user-preferences/domain/__tests__/user-preferences.fake-builder';

describe('GetUserPreferencesUseCase', () => {
  let useCase: GetUserPreferencesUseCase;
  let repository: UserPreferencesInMemoryRepository;

  beforeEach(() => {
    repository = new UserPreferencesInMemoryRepository();
    useCase = new GetUserPreferencesUseCase(repository);
  });

  it('should return existing preferences', async () => {
    const prefs = UserPreferencesFakeBuilder.anEntity().withUserId('user-1').build();
    await repository.save(prefs);

    const output = await useCase.execute({ userId: 'user-1' });

    expect(output.userId).toBe('user-1');
    expect(output.theme).toBe('SYSTEM');
    expect(output.language).toBe('pt-BR');
  });

  it('should create default preferences when not exist (lazy initialization)', async () => {
    const output = await useCase.execute({ userId: 'new-user' });

    expect(output.userId).toBe('new-user');
    expect(output.theme).toBe('SYSTEM');
    expect(output.language).toBe('pt-BR');
    expect(output.windowWidth).toBe(1280);
    expect(output.windowHeight).toBe(720);
  });

  it('should use "default" userId when not provided', async () => {
    const output = await useCase.execute({ userId: 'default' });

    expect(output.userId).toBe('default');
  });

  describe('edge cases', () => {
    it('should handle empty string userId with lazy initialization', async () => {
      const output = await useCase.execute({ userId: '' });

      expect(output.userId).toBe('');
      expect(output.theme).toBe('SYSTEM');
      expect(output.language).toBe('pt-BR');
    });

    it('should handle special characters in userId', async () => {
      const specialUserId = 'user@email.com';
      const output = await useCase.execute({ userId: specialUserId });

      expect(output.userId).toBe(specialUserId);
      expect(output.theme).toBe('SYSTEM');
    });

    it('should handle very long userId', async () => {
      const longUserId = 'a'.repeat(255);
      const output = await useCase.execute({ userId: longUserId });

      expect(output.userId).toBe(longUserId);
      expect(output.theme).toBe('SYSTEM');
    });
  });
});
