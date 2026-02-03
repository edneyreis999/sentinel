import { Chance } from 'chance';
import { ProjectName } from './project-name.vo';

const chance = new Chance();

type PropOrFactory<T> = T | ((index: number) => T);

/**
 * ProjectNameFakeBuilder
 *
 * Builder pattern for creating test instances of ProjectName Value Object.
 * Uses PropOrFactory pattern for flexible test data generation.
 *
 * @example
 * ```ts
 * // Single with defaults
 * const name = ProjectNameFakeBuilder.aProjectName().build();
 *
 * // Override specific value
 * const customName = ProjectNameFakeBuilder.aProjectName()
 *   .withValue('My Custom Project')
 *   .build();
 *
 * // Generate multiple
 * const names = ProjectNameFakeBuilder.theProjectNames(5).buildMany();
 * ```
 */
export class ProjectNameFakeBuilder {
  private _value: PropOrFactory<string> = (index) =>
    `${chance.capitalize(chance.word())} ${chance.capitalize(chance.word())} ${index + 1}`;

  static aProjectName(): ProjectNameFakeBuilder {
    return new ProjectNameFakeBuilder();
  }

  static theProjectNames(_count: number): ProjectNameFakeBuilder {
    return new ProjectNameFakeBuilder();
  }

  withValue(valueOrFactory: PropOrFactory<string>): this {
    this._value = valueOrFactory;
    return this;
  }

  /**
   * Create a name with minimum valid length (3 chars)
   */
  withMinLength(): this {
    this._value = 'Abc';
    return this;
  }

  /**
   * Create a name with maximum valid length (100 chars)
   */
  withMaxLength(): this {
    this._value = 'A'.repeat(100);
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
   * Create an invalid short name (< 3 chars) for testing validation
   */
  withTooShort(): this {
    this._value = 'Ab';
    return this;
  }

  /**
   * Create an invalid long name (> 100 chars) for testing validation
   */
  withTooLong(): this {
    this._value = 'A'.repeat(101);
    return this;
  }

  private callFactory<T>(valueOrFactory: PropOrFactory<T>, index: number): T {
    return valueOrFactory instanceof Function ? valueOrFactory(index) : valueOrFactory;
  }

  build(index = 0): ProjectName {
    const value = this.callFactory(this._value, index);
    return new ProjectName(value);
  }

  buildMany(count: number): ProjectName[] {
    return Array.from({ length: count }, (_, index) => this.build(index));
  }

  /**
   * Build raw value without creating VO (for testing invalid values)
   */
  buildValue(index = 0): string {
    return this.callFactory(this._value, index);
  }
}
