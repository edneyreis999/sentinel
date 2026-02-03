/**
 * ThemeMode Value Object
 *
 * Represents the theme preference with validation.
 * This is an immutable Value Object following DDD principles.
 */
export class ThemeMode {
  private static readonly VALID_MODES = ['LIGHT', 'DARK', 'SYSTEM'] as const;
  readonly value: 'LIGHT' | 'DARK' | 'SYSTEM';

  private constructor(value: 'LIGHT' | 'DARK' | 'SYSTEM') {
    this.value = value;
  }

  static create(value: string): ThemeMode {
    const upperValue = value.toUpperCase() as (typeof ThemeMode.VALID_MODES)[number];
    if (!ThemeMode.VALID_MODES.includes(upperValue)) {
      throw new Error(
        `Invalid theme mode: ${value}. Must be one of: ${ThemeMode.VALID_MODES.join(', ')}`,
      );
    }
    return new ThemeMode(upperValue);
  }

  static light(): ThemeMode {
    return new ThemeMode('LIGHT');
  }

  static dark(): ThemeMode {
    return new ThemeMode('DARK');
  }

  static system(): ThemeMode {
    return new ThemeMode('SYSTEM');
  }

  isLight(): boolean {
    return this.value === 'LIGHT';
  }

  isDark(): boolean {
    return this.value === 'DARK';
  }

  isSystem(): boolean {
    return this.value === 'SYSTEM';
  }

  equals(other: ThemeMode): boolean {
    return this.value === other.value;
  }

  toJSON() {
    return this.value;
  }

  toString() {
    return this.value;
  }
}
