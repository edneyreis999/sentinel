import { CreateProjectOutput } from '../../dto';

/**
 * FakeBuilder for CreateProjectOutput
 *
 * Provides a fluent interface to build test data with default values.
 * Used for mocking repository responses in unit tests.
 */
export class CreateProjectOutputFakeBuilder {
  private readonly data: CreateProjectOutput;

  private constructor(data: CreateProjectOutput) {
    this.data = data;
  }

  /**
   * Create a new builder with default values
   * Uses crypto.randomUUID() for unique IDs
   */
  static create(): CreateProjectOutputFakeBuilder {
    const now = new Date();
    return new CreateProjectOutputFakeBuilder({
      id: crypto.randomUUID(),
      path: '/default/test/path',
      name: 'Default Test Project',
      gameVersion: '1.0.0',
      screenshotPath: '/default/screenshot.png',
      trechoCount: null,
      lastOpenedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Override the id field
   */
  withId(id: string): CreateProjectOutputFakeBuilder {
    return new CreateProjectOutputFakeBuilder({ ...this.data, id });
  }

  /**
   * Override the name field
   */
  withName(name: string): CreateProjectOutputFakeBuilder {
    return new CreateProjectOutputFakeBuilder({ ...this.data, name });
  }

  /**
   * Override the path field
   */
  withPath(path: string): CreateProjectOutputFakeBuilder {
    return new CreateProjectOutputFakeBuilder({ ...this.data, path });
  }

  /**
   * Override the gameVersion field
   */
  withGameVersion(gameVersion: string | null): CreateProjectOutputFakeBuilder {
    return new CreateProjectOutputFakeBuilder({ ...this.data, gameVersion });
  }

  /**
   * Override the screenshotPath field
   */
  withScreenshotPath(screenshotPath: string | null): CreateProjectOutputFakeBuilder {
    return new CreateProjectOutputFakeBuilder({ ...this.data, screenshotPath });
  }

  /**
   * Override the trechoCount field
   */
  withTrechoCount(trechoCount: number | null): CreateProjectOutputFakeBuilder {
    return new CreateProjectOutputFakeBuilder({ ...this.data, trechoCount });
  }

  /**
   * Override the lastOpenedAt field
   */
  withLastOpenedAt(lastOpenedAt: Date): CreateProjectOutputFakeBuilder {
    return new CreateProjectOutputFakeBuilder({ ...this.data, lastOpenedAt });
  }

  /**
   * Build the final CreateProjectOutput object
   */
  build(): CreateProjectOutput {
    return { ...this.data };
  }
}
