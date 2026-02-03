import { RecentProject, RecentProjectProps } from './recent-project.aggregate';

type PropOrFactory<T> = T | ((index: number) => T);

/**
 * RecentProjectFakeBuilder
 *
 * Builder pattern for creating test instances of RecentProject.
 * Uses PropOrFactory pattern for flexible test data generation.
 *
 * @example
 * ```ts
 * // Single project with defaults
 * const project = RecentProjectFakeBuilder.aRecentProject().build();
 *
 * // Override specific properties
 * const customProject = RecentProjectFakeBuilder.aRecentProject()
 *   .withName('Custom Project')
 *   .withGameVersion('2.0.0')
 *   .build();
 *
 * // Generate multiple projects
 * const projects = RecentProjectFakeBuilder.theRecentProjects(5).buildMany();
 * ```
 */
export class RecentProjectFakeBuilder {
  private _id: PropOrFactory<string> = () => crypto.randomUUID();
  private _path: PropOrFactory<string> = (index) =>
    `/projects/sentinel-project-${index + 1}.sentinel`;
  private _name: PropOrFactory<string> = (index) => `Sentinel Project ${index + 1}`;
  private _gameVersion: PropOrFactory<string | null> = (index) => {
    const versions = ['1.0.0', '1.1.0', '1.2.0', '2.0.0', null];
    return versions[index % versions.length];
  };
  private _screenshotPath: PropOrFactory<string | null> = (index) =>
    `/screenshots/project-${index + 1}.png`;
  private _trechoCount: PropOrFactory<number | null> = (index) => (index + 1) * 10;
  private _lastOpenedAt: PropOrFactory<Date> = (index) => {
    const date = new Date();
    date.setHours(date.getHours() - index); // Each project is 1 hour older
    return date;
  };
  private _createdAt: PropOrFactory<Date> = (index) => {
    const date = new Date();
    date.setDate(date.getDate() - (index + 1)); // Each project created 1 day apart
    return date;
  };
  private _updatedAt: PropOrFactory<Date> = (index) => {
    const date = new Date();
    date.setMinutes(date.getMinutes() - index * 5); // Each project updated 5 min apart
    return date;
  };

  private currentIndex = 0;

  static aRecentProject(): RecentProjectFakeBuilder {
    return new RecentProjectFakeBuilder();
  }

  static theRecentProjects(_count: number): RecentProjectFakeBuilder {
    return new RecentProjectFakeBuilder();
  }

  withId(valueOrFactory: PropOrFactory<string>): this {
    this._id = valueOrFactory;
    return this;
  }

  withPath(valueOrFactory: PropOrFactory<string>): this {
    this._path = valueOrFactory;
    return this;
  }

  withName(valueOrFactory: PropOrFactory<string>): this {
    this._name = valueOrFactory;
    return this;
  }

  withGameVersion(valueOrFactory: PropOrFactory<string | null>): this {
    this._gameVersion = valueOrFactory;
    return this;
  }

  withScreenshotPath(valueOrFactory: PropOrFactory<string | null>): this {
    this._screenshotPath = valueOrFactory;
    return this;
  }

  withTrechoCount(valueOrFactory: PropOrFactory<number | null>): this {
    this._trechoCount = valueOrFactory;
    return this;
  }

  withLastOpenedAt(valueOrFactory: PropOrFactory<Date>): this {
    this._lastOpenedAt = valueOrFactory;
    return this;
  }

  withCreatedAt(valueOrFactory: PropOrFactory<Date>): this {
    this._createdAt = valueOrFactory;
    return this;
  }

  withUpdatedAt(valueOrFactory: PropOrFactory<Date>): this {
    this._updatedAt = valueOrFactory;
    return this;
  }

  /**
   * Create a project with invalid data for testing validation
   */
  withInvalidPath(): this {
    this._path = '';
    return this;
  }

  withEmptyName(): this {
    this._name = '';
    return this;
  }

  withNegativeTrechoCount(): this {
    this._trechoCount = -1;
    return this;
  }

  private callFactory<T>(valueOrFactory: PropOrFactory<T>, index: number): T {
    return valueOrFactory instanceof Function ? valueOrFactory(index) : valueOrFactory;
  }

  build(index = 0): RecentProject {
    this.currentIndex = index;

    const props: RecentProjectProps = {
      id: this.callFactory(this._id, index),
      path: this.callFactory(this._path, index),
      name: this.callFactory(this._name, index),
      gameVersion: this.callFactory(this._gameVersion, index),
      screenshotPath: this.callFactory(this._screenshotPath, index),
      trechoCount: this.callFactory(this._trechoCount, index),
      lastOpenedAt: this.callFactory(this._lastOpenedAt, index),
      createdAt: this.callFactory(this._createdAt, index),
      updatedAt: this.callFactory(this._updatedAt, index),
    };

    return RecentProject.fromPersistence(props);
  }

  buildMany(count: number): RecentProject[] {
    return Array.from({ length: count }, (_, index) => this.build(index));
  }
}
