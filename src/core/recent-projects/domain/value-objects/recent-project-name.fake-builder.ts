import { Chance } from 'chance';
import { RecentProjectName } from './recent-project-name.vo';

const chance = new Chance();

type PropOrFactory<T> = T | ((index: number) => T);

/**
 * RecentProjectNameFakeBuilder
 *
 * Builder pattern for creating test instances of RecentProjectName Value Object.
 * Uses PropOrFactory pattern for flexible test data generation.
 *
 * @example
 * ```ts
 * // Single with defaults
 * const name = RecentProjectNameFakeBuilder.aRecentProjectName().build();
 *
 * // Override specific value
 * const customName = RecentProjectNameFakeBuilder.aRecentProjectName()
 *   .withValue('My Game Project')
 *   .build();
 *
 * // Generate multiple
 * const names = RecentProjectNameFakeBuilder.theRecentProjectNames(5).buildMany();
 * ```
 */
export class RecentProjectNameFakeBuilder {
  private _value: PropOrFactory<string> = (index) =>
    `${chance.capitalize(chance.word())} ${chance.capitalize(chance.word())} Project ${index + 1}`;

  static aRecentProjectName(): RecentProjectNameFakeBuilder {
    return new RecentProjectNameFakeBuilder();
  }

  static theRecentProjectNames(_count: number): RecentProjectNameFakeBuilder {
    return new RecentProjectNameFakeBuilder();
  }

  withValue(valueOrFactory: PropOrFactory<string>): this {
    this._value = valueOrFactory;
    return this;
  }

  /**
   * Create a name with minimum valid length (1 char)
   */
  withMinLength(): this {
    this._value = 'A';
    return this;
  }

  /**
   * Create a name with maximum valid length (255 chars)
   */
  withMaxLength(): this {
    this._value = 'A'.repeat(255);
    return this;
  }

  /**
   * Create a realistic game project name
   */
  withRealisticName(): this {
    const genres = ['RPG', 'Adventure', 'Strategy', 'Puzzle', 'Action'];
    const themes = ['Fantasy', 'Sci-Fi', 'Medieval', 'Modern', 'Cosmic'];
    this._value = (index) => {
      const genre = genres[index % genres.length];
      const theme = themes[index % themes.length];
      return `${theme} ${genre} ${chance.capitalize(chance.word())}`;
    };
    return this;
  }

  /**
   * Create an invalid empty name for testing validation
   */
  withEmptyValue(): this {
    this._value = '';
    return this;
  }

  /**
   * Create an invalid whitespace-only name for testing validation
   */
  withWhitespaceOnly(): this {
    this._value = '   ';
    return this;
  }

  /**
   * Create an invalid name exceeding max length (> 255 chars)
   */
  withTooLong(): this {
    this._value = 'A'.repeat(256);
    return this;
  }

  /**
   * Create an invalid name with control characters
   */
  withControlCharacters(): this {
    this._value = 'Project\x00Name';
    return this;
  }

  private callFactory<T>(valueOrFactory: PropOrFactory<T>, index: number): T {
    return valueOrFactory instanceof Function ? valueOrFactory(index) : valueOrFactory;
  }

  build(index = 0): RecentProjectName {
    const value = this.callFactory(this._value, index);
    return RecentProjectName.create(value);
  }

  buildMany(count: number): RecentProjectName[] {
    return Array.from({ length: count }, (_, index) => this.build(index));
  }

  /**
   * Build raw value without creating VO (for testing invalid values)
   */
  buildValue(index = 0): string {
    return this.callFactory(this._value, index);
  }
}
