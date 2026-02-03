import { RemoveRecentProjectInput } from '../../../dto/input/remove-recent-project.input';

/**
 * FakeBuilder for RemoveRecentProjectInput
 *
 * Provides a fluent interface to build test data with default values.
 * Implements the FakeBuilder pattern for efficient test data creation.
 *
 * USAGE:
 * ```ts
 * const input = RemoveRecentProjectInputFakeBuilder.create()
 *   .withPath('/projects/to-remove.sentinel')
 *   .build();
 * ```
 */
export class RemoveRecentProjectInputFakeBuilder {
  private readonly data: RemoveRecentProjectInput;

  private constructor(data: RemoveRecentProjectInput) {
    this.data = data;
  }

  /**
   * Create a new builder with default values
   */
  static create(): RemoveRecentProjectInputFakeBuilder {
    return new RemoveRecentProjectInputFakeBuilder({
      path: '/default/test.sentinel',
    });
  }

  /**
   * Create a builder with empty path for negative tests
   */
  static createWithEmptyPath(): RemoveRecentProjectInputFakeBuilder {
    return new RemoveRecentProjectInputFakeBuilder({
      path: '',
    });
  }

  /**
   * Create a builder with whitespace-only path for negative tests
   */
  static createWithWhitespacePath(): RemoveRecentProjectInputFakeBuilder {
    return new RemoveRecentProjectInputFakeBuilder({
      path: '   ',
    });
  }

  /**
   * Override the path field
   */
  withPath(path: string): RemoveRecentProjectInputFakeBuilder {
    return new RemoveRecentProjectInputFakeBuilder({ ...this.data, path });
  }

  /**
   * Build the final RemoveRecentProjectInput object
   */
  build(): RemoveRecentProjectInput {
    return { ...this.data };
  }
}
