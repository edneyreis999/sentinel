import { ListRecentProjectsInput } from '../../../dto/input/list-recent-projects.input';

/**
 * FakeBuilder for ListRecentProjectsInput
 *
 * Provides a fluent interface to build test data with default values.
 * Implements the FakeBuilder pattern for efficient test data creation.
 *
 * USAGE:
 * ```ts
 * const input = ListRecentProjectsInputFakeBuilder.create()
 *   .withLimit(15)
 *   .withOffset(10)
 *   .build();
 * ```
 */
export class ListRecentProjectsInputFakeBuilder {
  private readonly data: ListRecentProjectsInput;

  private constructor(data: ListRecentProjectsInput) {
    this.data = data;
  }

  /**
   * Create a new builder with default pagination
   */
  static create(): ListRecentProjectsInputFakeBuilder {
    return new ListRecentProjectsInputFakeBuilder({
      limit: 10,
      offset: 0,
    });
  }

  /**
   * Create a builder with empty input (all defaults)
   */
  static createEmpty(): ListRecentProjectsInputFakeBuilder {
    return new ListRecentProjectsInputFakeBuilder({});
  }

  /**
   * Create a builder with invalid limit for negative tests
   */
  static createWithInvalidLimit(limit: number): ListRecentProjectsInputFakeBuilder {
    return new ListRecentProjectsInputFakeBuilder({
      limit,
    });
  }

  /**
   * Create a builder with invalid offset for negative tests
   */
  static createWithInvalidOffset(offset: number): ListRecentProjectsInputFakeBuilder {
    return new ListRecentProjectsInputFakeBuilder({
      offset,
    });
  }

  /**
   * Override the limit field
   */
  withLimit(limit: number): ListRecentProjectsInputFakeBuilder {
    return new ListRecentProjectsInputFakeBuilder({ ...this.data, limit });
  }

  /**
   * Override the offset field
   */
  withOffset(offset: number): ListRecentProjectsInputFakeBuilder {
    return new ListRecentProjectsInputFakeBuilder({ ...this.data, offset });
  }

  /**
   * Override the nameFilter field
   */
  withNameFilter(nameFilter: string): ListRecentProjectsInputFakeBuilder {
    return new ListRecentProjectsInputFakeBuilder({ ...this.data, nameFilter });
  }

  /**
   * Override the gameVersion field
   */
  withGameVersion(gameVersion: string): ListRecentProjectsInputFakeBuilder {
    return new ListRecentProjectsInputFakeBuilder({ ...this.data, gameVersion });
  }

  /**
   * Remove limit (set to undefined)
   */
  withoutLimit(): ListRecentProjectsInputFakeBuilder {
    return new ListRecentProjectsInputFakeBuilder({ ...this.data, limit: undefined });
  }

  /**
   * Remove offset (set to undefined)
   */
  withoutOffset(): ListRecentProjectsInputFakeBuilder {
    return new ListRecentProjectsInputFakeBuilder({ ...this.data, offset: undefined });
  }

  /**
   * Build the final ListRecentProjectsInput object
   */
  build(): ListRecentProjectsInput {
    return { ...this.data };
  }
}
