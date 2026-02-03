import { Chance } from 'chance';
import { GddPath } from './gdd-path.vo';

const chance = new Chance();

type PropOrFactory<T> = T | ((index: number) => T);

/**
 * GddPathFakeBuilder
 *
 * Builder pattern for creating test instances of GddPath Value Object.
 * Uses PropOrFactory pattern for flexible test data generation.
 *
 * @example
 * ```ts
 * // Single with defaults
 * const path = GddPathFakeBuilder.aGddPath().build();
 *
 * // Override specific value
 * const customPath = GddPathFakeBuilder.aGddPath()
 *   .withValue('/custom/path.md')
 *   .build();
 *
 * // Generate multiple
 * const paths = GddPathFakeBuilder.theGddPaths(5).buildMany();
 * ```
 */
export class GddPathFakeBuilder {
  private _value: PropOrFactory<string> = (index) => {
    const extensions = ['.md', '.json', '/'];
    const ext = extensions[index % extensions.length];
    return `/gdd/${chance.word()}-${index + 1}${ext}`;
  };

  static aGddPath(): GddPathFakeBuilder {
    return new GddPathFakeBuilder();
  }

  static theGddPaths(_count: number): GddPathFakeBuilder {
    return new GddPathFakeBuilder();
  }

  withValue(valueOrFactory: PropOrFactory<string>): this {
    this._value = valueOrFactory;
    return this;
  }

  /**
   * Create a markdown file path
   */
  withMarkdownPath(): this {
    this._value = (index) => `/docs/document-${index + 1}.md`;
    return this;
  }

  /**
   * Create a JSON file path
   */
  withJsonPath(): this {
    this._value = (index) => `/data/config-${index + 1}.json`;
    return this;
  }

  /**
   * Create a directory path
   */
  withDirectoryPath(): this {
    this._value = (index) => `/folder-${index + 1}/`;
    return this;
  }

  /**
   * Create root path
   */
  withRootPath(): this {
    this._value = '/';
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
   * Create an invalid path without leading slash
   */
  withNoLeadingSlash(): this {
    this._value = 'invalid/path.md';
    return this;
  }

  /**
   * Create an invalid path with wrong extension
   */
  withInvalidExtension(): this {
    this._value = '/path/file.txt';
    return this;
  }

  /**
   * Create an invalid path with consecutive slashes
   */
  withDoubleSlashes(): this {
    this._value = '/path//file.md';
    return this;
  }

  /**
   * Create a path with maximum length (500 chars)
   */
  withMaxLength(): this {
    const basePath = '/';
    const padding = 'a'.repeat(495);
    this._value = `${basePath}${padding}.md`;
    return this;
  }

  /**
   * Create an invalid path exceeding max length
   */
  withTooLong(): this {
    const basePath = '/';
    const padding = 'a'.repeat(500);
    this._value = `${basePath}${padding}.md`;
    return this;
  }

  private callFactory<T>(valueOrFactory: PropOrFactory<T>, index: number): T {
    return valueOrFactory instanceof Function ? valueOrFactory(index) : valueOrFactory;
  }

  build(index = 0): GddPath {
    const value = this.callFactory(this._value, index);
    return new GddPath(value);
  }

  buildMany(count: number): GddPath[] {
    return Array.from({ length: count }, (_, index) => this.build(index));
  }

  /**
   * Build raw value without creating VO (for testing invalid values)
   */
  buildValue(index = 0): string {
    return this.callFactory(this._value, index);
  }
}
