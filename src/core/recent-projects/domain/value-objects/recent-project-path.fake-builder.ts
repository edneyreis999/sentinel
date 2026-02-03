import { Chance } from 'chance';
import { RecentProjectPath } from './recent-project-path.vo';

const chance = new Chance();

type PropOrFactory<T> = T | ((index: number) => T);

/**
 * RecentProjectPathFakeBuilder
 *
 * Builder pattern for creating test instances of RecentProjectPath Value Object.
 * Uses PropOrFactory pattern for flexible test data generation.
 *
 * @example
 * ```ts
 * // Single with defaults
 * const path = RecentProjectPathFakeBuilder.aRecentProjectPath().build();
 *
 * // Override specific value
 * const customPath = RecentProjectPathFakeBuilder.aRecentProjectPath()
 *   .withValue('/projects/my-game.sentinel')
 *   .build();
 *
 * // Generate multiple
 * const paths = RecentProjectPathFakeBuilder.theRecentProjectPaths(5).buildMany();
 * ```
 */
export class RecentProjectPathFakeBuilder {
  private _value: PropOrFactory<string> = (index) =>
    `/projects/${chance.word()}-${index + 1}/${chance.word()}.sentinel`;

  static aRecentProjectPath(): RecentProjectPathFakeBuilder {
    return new RecentProjectPathFakeBuilder();
  }

  static theRecentProjectPaths(_count: number): RecentProjectPathFakeBuilder {
    return new RecentProjectPathFakeBuilder();
  }

  withValue(valueOrFactory: PropOrFactory<string>): this {
    this._value = valueOrFactory;
    return this;
  }

  /**
   * Create a Unix absolute path
   */
  withUnixPath(): this {
    this._value = (index) => `/home/user/projects/game-${index + 1}/project.sentinel`;
    return this;
  }

  /**
   * Create a Windows absolute path
   */
  withWindowsPath(): this {
    this._value = (index) => `C:/Users/Developer/Projects/game-${index + 1}/project.sentinel`;
    return this;
  }

  /**
   * Create a relative path
   */
  withRelativePath(): this {
    this._value = (index) => `./projects/game-${index + 1}/project.sentinel`;
    return this;
  }

  /**
   * Create a parent-relative path
   */
  withParentRelativePath(): this {
    this._value = (index) => `../projects/game-${index + 1}/project.sentinel`;
    return this;
  }

  /**
   * Create a path with .sentinel extension
   */
  withSentinelExtension(): this {
    this._value = (index) => `/projects/game-${index + 1}.sentinel`;
    return this;
  }

  /**
   * Create an invalid empty path for testing validation
   */
  withEmptyValue(): this {
    this._value = '';
    return this;
  }

  /**
   * Create an invalid whitespace-only path for testing validation
   */
  withWhitespaceOnly(): this {
    this._value = '   ';
    return this;
  }

  /**
   * Create an invalid path format for testing validation
   */
  withInvalidFormat(): this {
    this._value = 'invalid path with spaces and no structure';
    return this;
  }

  private callFactory<T>(valueOrFactory: PropOrFactory<T>, index: number): T {
    return valueOrFactory instanceof Function ? valueOrFactory(index) : valueOrFactory;
  }

  build(index = 0): RecentProjectPath {
    const value = this.callFactory(this._value, index);
    return RecentProjectPath.create(value);
  }

  buildMany(count: number): RecentProjectPath[] {
    return Array.from({ length: count }, (_, index) => this.build(index));
  }

  /**
   * Build raw value without creating VO (for testing invalid values)
   */
  buildValue(index = 0): string {
    return this.callFactory(this._value, index);
  }
}
