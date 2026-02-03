import { UserPreferences } from '../entities/user-preferences.aggregate';
import { UserPreferencesFakeBuilder } from './user-preferences.fake-builder';

describe('UserPreferences Aggregate', () => {
  describe('createDefaults', () => {
    it('should create preferences with default values', () => {
      const prefs = UserPreferences.createDefaults('test-user');

      expect(prefs.userId).toBe('test-user');
      expect(prefs.theme).toBe('SYSTEM');
      expect(prefs.language).toBe('pt-BR');
      expect(prefs.windowWidth).toBe(1280);
      expect(prefs.windowHeight).toBe(720);
      expect(prefs.windowX).toBeNull();
      expect(prefs.windowY).toBeNull();
      expect(prefs.windowIsMaximized).toBe(false);
      expect(prefs.autoSaveInterval).toBe(30000);
      expect(prefs.maxHistoryEntries).toBe(100);
      expect(prefs.lastProjectPath).toBeNull();
      expect(prefs.lastOpenDate).toBeNull();
      expect(prefs.createdAt).toBeInstanceOf(Date);
      expect(prefs.updatedAt).toBeInstanceOf(Date);
    });

    it('should use "default" userId when not provided', () => {
      const prefs = UserPreferences.createDefaults();
      expect(prefs.userId).toBe('default');
    });
  });

  describe('create', () => {
    it('should create preferences from props', () => {
      const now = new Date();
      const prefs = UserPreferences.create({
        id: 'test-id',
        userId: 'user-1',
        theme: 'DARK',
        language: 'en-US',
        windowWidth: 1920,
        windowHeight: 1080,
        windowX: 100,
        windowY: 100,
        windowIsMaximized: true,
        autoSaveInterval: 60000,
        maxHistoryEntries: 200,
        lastProjectPath: '/path/to/project',
        lastOpenDate: now,
        createdAt: now,
        updatedAt: now,
      });

      expect(prefs.userId).toBe('user-1');
      expect(prefs.theme).toBe('DARK');
      expect(prefs.language).toBe('en-US');
      expect(prefs.windowWidth).toBe(1920);
      expect(prefs.windowHeight).toBe(1080);
      expect(prefs.windowX).toBe(100);
      expect(prefs.windowY).toBe(100);
      expect(prefs.windowIsMaximized).toBe(true);
      expect(prefs.autoSaveInterval).toBe(60000);
      expect(prefs.maxHistoryEntries).toBe(200);
      expect(prefs.lastProjectPath).toBe('/path/to/project');
      expect(prefs.lastOpenDate).toBe(now);
    });
  });

  describe('changeTheme', () => {
    it('should change theme and update updatedAt', () => {
      const prefs = UserPreferences.createDefaults();
      const originalUpdatedAt = prefs.updatedAt;

      // Wait a bit to ensure timestamp difference
      prefs.changeTheme('DARK');

      expect(prefs.theme).toBe('DARK');
      expect(prefs.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });
  });

  describe('changeLanguage', () => {
    it('should change language and update updatedAt', () => {
      const prefs = UserPreferences.createDefaults();

      prefs.changeLanguage('en-US');

      expect(prefs.language).toBe('en-US');
    });
  });

  describe('updateWindowDimensions', () => {
    it('should update window dimensions', () => {
      const prefs = UserPreferences.createDefaults();

      prefs.updateWindowDimensions(1920, 1080);

      expect(prefs.windowWidth).toBe(1920);
      expect(prefs.windowHeight).toBe(1080);
    });

    it('should throw error for invalid dimensions', () => {
      const prefs = UserPreferences.createDefaults();

      expect(() => prefs.updateWindowDimensions(0, 1080)).toThrow(
        'Window dimensions must be positive',
      );
      expect(() => prefs.updateWindowDimensions(1920, -100)).toThrow(
        'Window dimensions must be positive',
      );
    });
  });

  describe('updateWindowPosition', () => {
    it('should update window position', () => {
      const prefs = UserPreferences.createDefaults();

      prefs.updateWindowPosition(100, 200);

      expect(prefs.windowX).toBe(100);
      expect(prefs.windowY).toBe(200);
    });

    it('should set position to null', () => {
      const prefs = UserPreferences.createDefaults();
      prefs.updateWindowPosition(100, 200);

      prefs.updateWindowPosition(null, null);

      expect(prefs.windowX).toBeNull();
      expect(prefs.windowY).toBeNull();
    });
  });

  describe('setWindowMaximized', () => {
    it('should set window maximized state', () => {
      const prefs = UserPreferences.createDefaults();

      prefs.setWindowMaximized(true);

      expect(prefs.windowIsMaximized).toBe(true);
    });
  });

  describe('changeAutoSaveInterval', () => {
    it('should change auto save interval', () => {
      const prefs = UserPreferences.createDefaults();

      prefs.changeAutoSaveInterval(60000);

      expect(prefs.autoSaveInterval).toBe(60000);
    });

    it('should throw error for interval less than 5000ms', () => {
      const prefs = UserPreferences.createDefaults();

      expect(() => prefs.changeAutoSaveInterval(1000)).toThrow(
        'Auto-save interval must be at least 5000ms',
      );
    });
  });

  describe('changeMaxHistoryEntries', () => {
    it('should change max history entries', () => {
      const prefs = UserPreferences.createDefaults();

      prefs.changeMaxHistoryEntries(200);

      expect(prefs.maxHistoryEntries).toBe(200);
    });

    it('should throw error for entries less than 1', () => {
      const prefs = UserPreferences.createDefaults();

      expect(() => prefs.changeMaxHistoryEntries(0)).toThrow(
        'Max history entries must be between 1 and 1000',
      );
    });

    it('should throw error for entries greater than 1000', () => {
      const prefs = UserPreferences.createDefaults();

      expect(() => prefs.changeMaxHistoryEntries(1001)).toThrow(
        'Max history entries must be between 1 and 1000',
      );
    });
  });

  describe('updateLastProjectPath', () => {
    it('should update last project path and set lastOpenDate', () => {
      const prefs = UserPreferences.createDefaults();

      prefs.updateLastProjectPath('/new/path');

      expect(prefs.lastProjectPath).toBe('/new/path');
      expect(prefs.lastOpenDate).toBeInstanceOf(Date);
    });

    it('should clear last project path but keep lastOpenDate', () => {
      const prefs = UserPreferences.createDefaults();
      prefs.updateLastProjectPath('/path');

      prefs.updateLastProjectPath(null);

      expect(prefs.lastProjectPath).toBeNull();
      expect(prefs.lastOpenDate).toBeInstanceOf(Date);
    });
  });

  describe('toJSON', () => {
    it('should convert to plain object', () => {
      const prefs = UserPreferences.createDefaults('test-user');
      const json = prefs.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('userId', 'test-user');
      expect(json).toHaveProperty('theme', 'SYSTEM');
      expect(json).toHaveProperty('language', 'pt-BR');
      expect(json).toHaveProperty('windowWidth', 1280);
      expect(json).toHaveProperty('windowHeight', 720);
      expect(json).toHaveProperty('createdAt');
      expect(json).toHaveProperty('updatedAt');
    });
  });
});

describe('UserPreferencesFakeBuilder', () => {
  it('should create a single entity', () => {
    const prefs = UserPreferencesFakeBuilder.anEntity().build();

    expect(prefs).toBeInstanceOf(UserPreferences);
    expect(prefs.userId).toBe('default');
    expect(prefs.theme).toBe('SYSTEM');
  });

  it('should create multiple entities', () => {
    const preferences = UserPreferencesFakeBuilder.theEntities(3).build();

    expect(preferences).toHaveLength(3);
    expect(preferences[0]).toBeInstanceOf(UserPreferences);
    expect(preferences[1]).toBeInstanceOf(UserPreferences);
    expect(preferences[2]).toBeInstanceOf(UserPreferences);
  });

  it('should create entity with custom properties', () => {
    const prefs = UserPreferencesFakeBuilder.anEntity()
      .withUserId('custom-user')
      .withTheme('DARK')
      .withLanguage('en-US')
      .withWindowWidth(1920)
      .build();

    expect(prefs.userId).toBe('custom-user');
    expect(prefs.theme).toBe('DARK');
    expect(prefs.language).toBe('en-US');
    expect(prefs.windowWidth).toBe(1920);
  });

  it('should create entities with factory functions', () => {
    const preferences = UserPreferencesFakeBuilder.theEntities(3)
      .withUserId((index) => `user-${index}`)
      .withWindowWidth((index) => 800 + index * 100)
      .build();

    expect(preferences[0].userId).toBe('user-0');
    expect(preferences[1].userId).toBe('user-1');
    expect(preferences[2].userId).toBe('user-2');
    expect(preferences[0].windowWidth).toBe(800);
    expect(preferences[1].windowWidth).toBe(900);
    expect(preferences[2].windowWidth).toBe(1000);
  });
});
