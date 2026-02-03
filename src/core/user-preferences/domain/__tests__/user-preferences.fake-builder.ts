import { Chance } from 'chance';
import { UserPreferences } from '../entities/user-preferences.aggregate';

type PropOrFactory<T> = T | ((index: number) => T);

/**
 * FakeBuilder for UserPreferences aggregate
 *
 * Generates realistic test data for UserPreferences with fluent API.
 */
export class UserPreferencesFakeBuilder<TBuild = UserPreferences | UserPreferences[]> {
  private chance: Chance.Chance;
  private countObjs: number;
  private baseIndex: number;
  private static globalIndex = 0;

  // Properties with default values using factories
  private _id: PropOrFactory<string> = () => this.chance.guid();
  private _userId: PropOrFactory<string> = () => 'default';
  private _theme: PropOrFactory<'LIGHT' | 'DARK' | 'SYSTEM'> = () => 'SYSTEM';
  private _language: PropOrFactory<string> = () => 'pt-BR';
  private _windowWidth: PropOrFactory<number> = () => 1280;
  private _windowHeight: PropOrFactory<number> = () => 720;
  private _windowX: PropOrFactory<number | null> = () => null;
  private _windowY: PropOrFactory<number | null> = () => null;
  private _windowIsMaximized: PropOrFactory<boolean> = () => false;
  private _autoSaveInterval: PropOrFactory<number> = () => 30000;
  private _maxHistoryEntries: PropOrFactory<number> = () => 100;
  private _lastProjectPath: PropOrFactory<string | null> = () => null;
  private _lastOpenDate: PropOrFactory<Date | null> = () => null;
  private _createdAt: PropOrFactory<Date> = () => new Date();
  private _updatedAt: PropOrFactory<Date> = () => new Date();

  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.chance = new Chance();
    this.baseIndex = UserPreferencesFakeBuilder.globalIndex * 100;
    UserPreferencesFakeBuilder.globalIndex += 1;
  }

  static anEntity() {
    return new UserPreferencesFakeBuilder<UserPreferences>(1);
  }

  static theEntities(countObjs: number) {
    return new UserPreferencesFakeBuilder<UserPreferences[]>(countObjs);
  }

  withId(valueOrFactory: PropOrFactory<string>) {
    this._id = valueOrFactory;
    return this;
  }

  withUserId(valueOrFactory: PropOrFactory<string>) {
    this._userId = valueOrFactory;
    return this;
  }

  withTheme(valueOrFactory: PropOrFactory<'LIGHT' | 'DARK' | 'SYSTEM'>) {
    this._theme = valueOrFactory;
    return this;
  }

  withLanguage(valueOrFactory: PropOrFactory<string>) {
    this._language = valueOrFactory;
    return this;
  }

  withWindowWidth(valueOrFactory: PropOrFactory<number>) {
    this._windowWidth = valueOrFactory;
    return this;
  }

  withWindowHeight(valueOrFactory: PropOrFactory<number>) {
    this._windowHeight = valueOrFactory;
    return this;
  }

  withWindowX(valueOrFactory: PropOrFactory<number | null>) {
    this._windowX = valueOrFactory;
    return this;
  }

  withWindowY(valueOrFactory: PropOrFactory<number | null>) {
    this._windowY = valueOrFactory;
    return this;
  }

  withWindowIsMaximized(valueOrFactory: PropOrFactory<boolean>) {
    this._windowIsMaximized = valueOrFactory;
    return this;
  }

  withAutoSaveInterval(valueOrFactory: PropOrFactory<number>) {
    this._autoSaveInterval = valueOrFactory;
    return this;
  }

  withMaxHistoryEntries(valueOrFactory: PropOrFactory<number>) {
    this._maxHistoryEntries = valueOrFactory;
    return this;
  }

  withLastProjectPath(valueOrFactory: PropOrFactory<string | null>) {
    this._lastProjectPath = valueOrFactory;
    return this;
  }

  withLastOpenDate(valueOrFactory: PropOrFactory<Date | null>) {
    this._lastOpenDate = valueOrFactory;
    return this;
  }

  withCreatedAt(valueOrFactory: PropOrFactory<Date>) {
    this._createdAt = valueOrFactory;
    return this;
  }

  withUpdatedAt(valueOrFactory: PropOrFactory<Date>) {
    this._updatedAt = valueOrFactory;
    return this;
  }

  build(): TBuild {
    const entities = new Array(this.countObjs).fill(undefined).map((_, index) => {
      const props = {
        id: this.callFactory(this._id, index),
        userId: this.callFactory(this._userId, index),
        theme: this.callFactory(this._theme, index),
        language: this.callFactory(this._language, index),
        windowWidth: this.callFactory(this._windowWidth, index),
        windowHeight: this.callFactory(this._windowHeight, index),
        windowX: this.callFactory(this._windowX, index),
        windowY: this.callFactory(this._windowY, index),
        windowIsMaximized: this.callFactory(this._windowIsMaximized, index),
        autoSaveInterval: this.callFactory(this._autoSaveInterval, index),
        maxHistoryEntries: this.callFactory(this._maxHistoryEntries, index),
        lastProjectPath: this.callFactory(this._lastProjectPath, index),
        lastOpenDate: this.callFactory(this._lastOpenDate, index),
        createdAt: this.callFactory(this._createdAt, index),
        updatedAt: this.callFactory(this._updatedAt, index),
      };

      const entity = UserPreferences.create(props);
      return entity;
    });

    return (this.countObjs === 1 ? entities[0] : entities) as TBuild;
  }

  private callFactory(factoryOrValue: PropOrFactory<unknown>, index: number) {
    return typeof factoryOrValue === 'function' ? factoryOrValue(index) : factoryOrValue;
  }
}

// Add static method to aggregate
UserPreferences.fake = function () {
  return UserPreferencesFakeBuilder;
};

// Type augmentation
declare module '../entities/user-preferences.aggregate' {
  export interface UserPreferences {
    fake?: typeof UserPreferencesFakeBuilder;
  }
  namespace UserPreferences {
    export let fake: () => typeof UserPreferencesFakeBuilder;
  }
}
