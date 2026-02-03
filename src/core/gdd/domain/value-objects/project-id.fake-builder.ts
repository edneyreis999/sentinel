import { ProjectId } from './project-id.vo';

type PropOrFactory<T> = T | ((index: number) => T);

/**
 * ProjectIdFakeBuilder
 *
 * Builder pattern for creating test instances of ProjectId Value Object.
 * Uses PropOrFactory pattern for flexible test data generation.
 *
 * @example
 * ```ts
 * // Single with defaults (generates valid UUID)
 * const id = ProjectIdFakeBuilder.aProjectId().build();
 *
 * // Override specific value
 * const customId = ProjectIdFakeBuilder.aProjectId()
 *   .withValue('550e8400-e29b-41d4-a716-446655440000')
 *   .build();
 *
 * // Generate multiple
 * const ids = ProjectIdFakeBuilder.theProjectIds(5).buildMany();
 * ```
 */
export class ProjectIdFakeBuilder {
  private _value: PropOrFactory<string> = () => crypto.randomUUID();

  static aProjectId(): ProjectIdFakeBuilder {
    return new ProjectIdFakeBuilder();
  }

  static theProjectIds(_count: number): ProjectIdFakeBuilder {
    return new ProjectIdFakeBuilder();
  }

  withValue(valueOrFactory: PropOrFactory<string>): this {
    this._value = valueOrFactory;
    return this;
  }

  /**
   * Create with a specific deterministic UUID (useful for testing equality)
   */
  withDeterministicId(index: number): this {
    // Generate deterministic UUIDs based on index
    const hex = index.toString(16).padStart(12, '0');
    this._value = `00000000-0000-0000-0000-${hex}`;
    return this;
  }

  /**
   * Create an invalid empty ID for testing validation
   */
  withEmptyValue(): this {
    this._value = '';
    return this;
  }

  /**
   * Create an invalid non-UUID string for testing validation
   */
  withInvalidFormat(): this {
    this._value = 'not-a-valid-uuid';
    return this;
  }

  /**
   * Create an invalid ID exceeding max length (255 chars)
   */
  withTooLong(): this {
    this._value = 'a'.repeat(256);
    return this;
  }

  /**
   * Create with uppercase UUID (should be valid)
   */
  withUppercaseUuid(): this {
    this._value = () => crypto.randomUUID().toUpperCase();
    return this;
  }

  private callFactory<T>(valueOrFactory: PropOrFactory<T>, index: number): T {
    return valueOrFactory instanceof Function ? valueOrFactory(index) : valueOrFactory;
  }

  build(index = 0): ProjectId {
    const value = this.callFactory(this._value, index);
    return new ProjectId(value);
  }

  buildMany(count: number): ProjectId[] {
    return Array.from({ length: count }, (_, index) => this.build(index));
  }

  /**
   * Build raw value without creating VO (for testing invalid values)
   */
  buildValue(index = 0): string {
    return this.callFactory(this._value, index);
  }
}
