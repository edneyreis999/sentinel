import { GetUserPreferencesUseCase } from '../use-cases/get-user-preferences.use-case';
import { UserPreferencesInMemoryRepository } from '@core/user-preferences/infra';
import { UserPreferences } from '@core/user-preferences/domain';

describe('GetUserPreferencesUseCase', () => {
  let useCase: GetUserPreferencesUseCase;
  let repository: UserPreferencesInMemoryRepository;

  beforeEach(() => {
    repository = new UserPreferencesInMemoryRepository();
    useCase = new GetUserPreferencesUseCase(repository);
  });

  it('should return existing preferences', async () => {
    const prefs = UserPreferences.createDefaults('user-1');
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
});
