import { CreateRecentProjectInput } from '../../../dto/input/create-recent-project.input';

/**
 * FakeBuilder for CreateRecentProjectInput
 *
 * Provides a fluent interface to build test data with default values.
 * Implements the FakeBuilder pattern for efficient test data creation.
 *
 * USAGE:
 * ```ts
 * const input = CreateRecentProjectInputFakeBuilder.create()
 *   .withPath('/projects/test.sentinel')
 *   .withName('Test Project')
 *   .build();
 * ```
 */
export class CreateRecentProjectInputFakeBuilder {
  private readonly data: CreateRecentProjectInput;

  private constructor(data: CreateRecentProjectInput) {
    this.data = data;
  }

  /**
   * Create a new builder with default values
   */
  static create(): CreateRecentProjectInputFakeBuilder {
    return new CreateRecentProjectInputFakeBuilder({
      path: '/default/test.sentinel',
      name: 'Default Test Project',
      gameVersion: '1.0.0',
      screenshotPath: '/default/screenshot.png',
      trechoCount: 10,
    });
  }

  /**
   * Create a builder with minimal required fields
   */
  static createMinimal(): CreateRecentProjectInputFakeBuilder {
    return new CreateRecentProjectInputFakeBuilder({
      path: '/minimal/test.sentinel',
      name: 'Minimal Test Project',
    });
  }

  /**
   * Override the path field
   */
  withPath(path: string): CreateRecentProjectInputFakeBuilder {
    return new CreateRecentProjectInputFakeBuilder({ ...this.data, path });
  }

  /**
   * Override the name field
   */
  withName(name: string): CreateRecentProjectInputFakeBuilder {
    return new CreateRecentProjectInputFakeBuilder({ ...this.data, name });
  }

  /**
   * Override the gameVersion field
   */
  withGameVersion(gameVersion: string): CreateRecentProjectInputFakeBuilder {
    return new CreateRecentProjectInputFakeBuilder({ ...this.data, gameVersion });
  }

  /**
   * Override the screenshotPath field
   */
  withScreenshotPath(screenshotPath: string): CreateRecentProjectInputFakeBuilder {
    return new CreateRecentProjectInputFakeBuilder({ ...this.data, screenshotPath });
  }

  /**
   * Override the trechoCount field
   */
  withTrechoCount(trechoCount: number): CreateRecentProjectInputFakeBuilder {
    return new CreateRecentProjectInputFakeBuilder({ ...this.data, trechoCount });
  }

  /**
   * Remove gameVersion (set to undefined)
   */
  withoutGameVersion(): CreateRecentProjectInputFakeBuilder {
    return new CreateRecentProjectInputFakeBuilder({ ...this.data, gameVersion: undefined });
  }

  /**
   * Remove screenshotPath (set to undefined)
   */
  withoutScreenshotPath(): CreateRecentProjectInputFakeBuilder {
    return new CreateRecentProjectInputFakeBuilder({ ...this.data, screenshotPath: undefined });
  }

  /**
   * Remove trechoCount (set to undefined)
   */
  withoutTrechoCount(): CreateRecentProjectInputFakeBuilder {
    return new CreateRecentProjectInputFakeBuilder({ ...this.data, trechoCount: undefined });
  }

  /**
   * Build the final CreateRecentProjectInput object
   */
  build(): CreateRecentProjectInput {
    return { ...this.data };
  }
}
