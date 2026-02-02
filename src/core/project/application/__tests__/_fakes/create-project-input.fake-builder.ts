import { CreateProjectInput } from '../../dto';

/**
 * FakeBuilder for CreateProjectInput
 *
 * Provides a fluent interface to build test data with default values.
 * Implements the FakeBuilder pattern for efficient test data creation.
 *
 * USAGE:
 * ```ts
 * const input = CreateProjectInputFakeBuilder.create()
 *   .withName('Test Project')
 *   .withPath('/path/to/project')
 *   .build();
 * ```
 */
export class CreateProjectInputFakeBuilder {
  private readonly data: CreateProjectInput;

  private constructor(data: CreateProjectInput) {
    this.data = data;
  }

  /**
   * Create a new builder with default values
   */
  static create(): CreateProjectInputFakeBuilder {
    return new CreateProjectInputFakeBuilder({
      name: 'Default Test Project',
      path: '/default/test/path',
      gameVersion: '1.0.0',
      screenshotPath: '/default/screenshot.png',
    });
  }

  /**
   * Create a builder with invalid data for negative tests
   */
  static createInvalid(): CreateProjectInputFakeBuilder {
    return new CreateProjectInputFakeBuilder({
      name: 'ab', // Too short
      path: '', // Empty
      gameVersion: undefined,
      screenshotPath: undefined,
    });
  }

  /**
   * Override the name field
   */
  withName(name: string): CreateProjectInputFakeBuilder {
    return new CreateProjectInputFakeBuilder({ ...this.data, name });
  }

  /**
   * Override the path field
   */
  withPath(path: string): CreateProjectInputFakeBuilder {
    return new CreateProjectInputFakeBuilder({ ...this.data, path });
  }

  /**
   * Override the gameVersion field
   */
  withGameVersion(gameVersion: string): CreateProjectInputFakeBuilder {
    return new CreateProjectInputFakeBuilder({ ...this.data, gameVersion });
  }

  /**
   * Override the screenshotPath field
   */
  withScreenshotPath(screenshotPath: string): CreateProjectInputFakeBuilder {
    return new CreateProjectInputFakeBuilder({ ...this.data, screenshotPath });
  }

  /**
   * Remove gameVersion (set to undefined)
   */
  withoutGameVersion(): CreateProjectInputFakeBuilder {
    return new CreateProjectInputFakeBuilder({ ...this.data, gameVersion: undefined });
  }

  /**
   * Remove screenshotPath (set to undefined)
   */
  withoutScreenshotPath(): CreateProjectInputFakeBuilder {
    return new CreateProjectInputFakeBuilder({ ...this.data, screenshotPath: undefined });
  }

  /**
   * Build the final CreateProjectInput object
   */
  build(): CreateProjectInput {
    return { ...this.data };
  }
}
