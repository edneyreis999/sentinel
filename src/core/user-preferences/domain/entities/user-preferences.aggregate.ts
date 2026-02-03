import { ThemeMode, LanguageCode } from '../value-objects';
import { UserId } from './user-id.vo';

/**
 * UserPreferences Aggregate Root
 *
 * This is the Domain Entity that encapsulates user preferences.
 * It follows DDD principles with invariants validation and factory methods.
 *
 * Invariants:
 * - autoSaveInterval must be >= 5000ms
 * - maxHistoryEntries must be >= 1 and <= 1000
 * - window dimensions must be positive
 */
export class UserPreferences {
  private constructor(
    readonly id: UserId,
    readonly userId: string,
    private _theme: ThemeMode,
    private _language: LanguageCode,
    private _windowWidth: number,
    private _windowHeight: number,
    private _windowX: number | null,
    private _windowY: number | null,
    private _windowIsMaximized: boolean,
    private _autoSaveInterval: number,
    private _maxHistoryEntries: number,
    private _lastProjectPath: string | null,
    private _lastOpenDate: Date | null,
    readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  /**
   * Factory method to create UserPreferences with default values
   */
  static createDefaults(userId: string = 'default'): UserPreferences {
    const now = new Date();
    return new UserPreferences(
      UserId.create(),
      userId,
      ThemeMode.system(),
      LanguageCode.ptBR(),
      1280, // windowWidth
      720, // windowHeight
      null, // windowX
      null, // windowY
      false, // windowIsMaximized
      30000, // autoSaveInterval (30s)
      100, // maxHistoryEntries
      null, // lastProjectPath
      null, // lastOpenDate
      now,
      now,
    );
  }

  /**
   * Factory method to create UserPreferences from existing data
   */
  static create(props: {
    id: string;
    userId: string;
    theme: string;
    language: string;
    windowWidth: number;
    windowHeight: number;
    windowX: number | null;
    windowY: number | null;
    windowIsMaximized: boolean;
    autoSaveInterval: number;
    maxHistoryEntries: number;
    lastProjectPath: string | null;
    lastOpenDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserPreferences {
    return new UserPreferences(
      UserId.create(props.id),
      props.userId,
      ThemeMode.create(props.theme),
      LanguageCode.create(props.language),
      props.windowWidth,
      props.windowHeight,
      props.windowX,
      props.windowY,
      props.windowIsMaximized,
      props.autoSaveInterval,
      props.maxHistoryEntries,
      props.lastProjectPath,
      props.lastOpenDate,
      props.createdAt,
      props.updatedAt,
    );
  }

  // Getters
  get theme(): string {
    return this._theme.toString();
  }

  get language(): string {
    return this._language.toString();
  }

  get windowWidth(): number {
    return this._windowWidth;
  }

  get windowHeight(): number {
    return this._windowHeight;
  }

  get windowX(): number | null {
    return this._windowX;
  }

  get windowY(): number | null {
    return this._windowY;
  }

  get windowIsMaximized(): boolean {
    return this._windowIsMaximized;
  }

  get autoSaveInterval(): number {
    return this._autoSaveInterval;
  }

  get maxHistoryEntries(): number {
    return this._maxHistoryEntries;
  }

  get lastProjectPath(): string | null {
    return this._lastProjectPath;
  }

  get lastOpenDate(): Date | null {
    return this._lastOpenDate;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business methods

  changeTheme(theme: string): void {
    this._theme = ThemeMode.create(theme);
    this._updatedAt = new Date();
  }

  changeLanguage(language: string): void {
    this._language = LanguageCode.create(language);
    this._updatedAt = new Date();
  }

  updateWindowDimensions(width: number, height: number): void {
    if (width <= 0 || height <= 0) {
      throw new Error('Window dimensions must be positive');
    }
    this._windowWidth = width;
    this._windowHeight = height;
    this._updatedAt = new Date();
  }

  updateWindowPosition(x: number | null, y: number | null): void {
    this._windowX = x;
    this._windowY = y;
    this._updatedAt = new Date();
  }

  setWindowMaximized(maximized: boolean): void {
    this._windowIsMaximized = maximized;
    this._updatedAt = new Date();
  }

  changeAutoSaveInterval(interval: number): void {
    if (interval < 5000) {
      throw new Error('Auto-save interval must be at least 5000ms');
    }
    this._autoSaveInterval = interval;
    this._updatedAt = new Date();
  }

  changeMaxHistoryEntries(entries: number): void {
    if (entries < 1 || entries > 1000) {
      throw new Error('Max history entries must be between 1 and 1000');
    }
    this._maxHistoryEntries = entries;
    this._updatedAt = new Date();
  }

  updateLastProjectPath(path: string | null): void {
    this._lastProjectPath = path;
    if (path) {
      this._lastOpenDate = new Date();
    }
    this._updatedAt = new Date();
  }

  /**
   * Convert to plain object for persistence
   */
  toJSON() {
    return {
      id: this.id.value,
      userId: this.userId,
      theme: this.theme,
      language: this.language,
      windowWidth: this.windowWidth,
      windowHeight: this.windowHeight,
      windowX: this.windowX,
      windowY: this.windowY,
      windowIsMaximized: this.windowIsMaximized,
      autoSaveInterval: this.autoSaveInterval,
      maxHistoryEntries: this.maxHistoryEntries,
      lastProjectPath: this.lastProjectPath,
      lastOpenDate: this.lastOpenDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
