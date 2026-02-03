import { Chance } from 'chance';
import { GameVersion } from './game-version.vo';

const chance = new Chance();

type PropOrFactory<T> = T | ((index: number) => T);

/**
 * GameVersionFakeBuilder
 *
 * Builder pattern for creating test instances of GameVersion Value Object.
 * Uses PropOrFactory pattern for flexible test data generation.
 *
 * @example
 * ```ts
 * // Single with defaults
 * const version = GameVersionFakeBuilder.aGameVersion().build();
 *
 * // Override specific value
 * const customVersion = GameVersionFakeBuilder.aGameVersion()
 *   .withValue('2.0.0')
 *   .build();
 *
 * // Generate multiple
 * const versions = GameVersionFakeBuilder.theGameVersions(5).buildMany();
 * ```
 */
export class GameVersionFakeBuilder {
  private _value: PropOrFactory<string> = (index) => {
    const major = Math.floor(index / 10);
    const minor = index % 10;
    const patch = chance.integer({ min: 0, max: 9 });
    return `${major}.${minor}.${patch}`;
  };

  static aGameVersion(): GameVersionFakeBuilder {
    return new GameVersionFakeBuilder();
  }

  static theGameVersions(_count: number): GameVersionFakeBuilder {
    return new GameVersionFakeBuilder();
  }

  withValue(valueOrFactory: PropOrFactory<string>): this {
    this._value = valueOrFactory;
    return this;
  }

  /**
   * Create a simple semver version (e.g., "1.0.0")
   */
  withSimpleVersion(): this {
    this._value = '1.0.0';
    return this;
  }

  /**
   * Create a prerelease version (e.g., "1.0.0-beta")
   */
  withPrereleaseVersion(): this {
    this._value = (index) => `${index + 1}.0.0-beta`;
    return this;
  }

  /**
   * Create a version with build metadata (e.g., "1.0.0+build.123")
   */
  withBuildMetadata(): this {
    this._value = (index) => `${index + 1}.0.0+build.${chance.integer({ min: 100, max: 999 })}`;
    return this;
  }

  /**
   * Create a version with 'v' prefix (e.g., "v1.0.0")
   */
  withVPrefix(): this {
    this._value = (index) => `v${index + 1}.0.0`;
    return this;
  }

  /**
   * Create a full semver with prerelease and build (e.g., "1.0.0-alpha.1+build.456")
   */
  withFullSemver(): this {
    this._value = (index) =>
      `${index + 1}.0.0-alpha.${index + 1}+build.${chance.integer({ min: 100, max: 999 })}`;
    return this;
  }

  /**
   * Create an invalid empty version for testing validation
   */
  withEmptyValue(): this {
    this._value = '';
    return this;
  }

  /**
   * Create an invalid version format for testing validation
   */
  withInvalidFormat(): this {
    this._value = 'not-a-version';
    return this;
  }

  /**
   * Create an invalid partial version (e.g., "1.0")
   */
  withPartialVersion(): this {
    this._value = '1.0';
    return this;
  }

  private callFactory<T>(valueOrFactory: PropOrFactory<T>, index: number): T {
    return valueOrFactory instanceof Function ? valueOrFactory(index) : valueOrFactory;
  }

  build(index = 0): GameVersion | null {
    const value = this.callFactory(this._value, index);
    return GameVersion.create(value);
  }

  buildMany(count: number): (GameVersion | null)[] {
    return Array.from({ length: count }, (_, index) => this.build(index));
  }

  /**
   * Build raw value without creating VO (for testing invalid values)
   */
  buildValue(index = 0): string {
    return this.callFactory(this._value, index);
  }

  /**
   * Build and assert non-null (for when you know the version is valid)
   */
  buildNonNull(index = 0): GameVersion {
    const version = this.build(index);
    if (version === null) {
      throw new Error('Expected non-null GameVersion');
    }
    return version;
  }
}
