import { DomainError } from '@core/shared/domain/errors';
import { RecentProjectPath, RecentProjectName, GameVersion } from './value-objects';

export type RecentProjectStatus = 'active' | 'archived' | 'deleted';

export interface RecentProjectProps {
  id: string;
  path: string;
  name: string;
  gameVersion: string | null;
  screenshotPath: string | null;
  trechoCount: number | null;
  lastOpenedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRecentProjectProps {
  path: string;
  name: string;
  gameVersion?: string;
  screenshotPath?: string;
  trechoCount?: number;
}

/**
 * RecentProject Aggregate
 *
 * Represents a recently opened project in the Sentinel system.
 * Encapsulates business rules for managing recent project entries.
 *
 * Business Rules:
 * - Path must be unique
 * - Name cannot be empty
 * - Trecho count must be non-negative
 * - Automatically updates lastOpenedAt when reopened
 */
export class RecentProject {
  private readonly _id: string;
  private _path: RecentProjectPath;
  private _name: RecentProjectName;
  private readonly _gameVersion: GameVersion | null;
  private _screenshotPath: string | null;
  private _trechoCount: number | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _lastOpenedAt: Date;

  private constructor(props: RecentProjectProps) {
    this._id = props.id;
    this._path = RecentProjectPath.create(props.path);
    this._name = RecentProjectName.create(props.name);
    this._gameVersion = props.gameVersion ? GameVersion.create(props.gameVersion) : null;
    this._screenshotPath = props.screenshotPath ?? null;
    this._trechoCount = props.trechoCount ?? null;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._lastOpenedAt = props.lastOpenedAt;

    this.validate();
  }

  /**
   * Create a new RecentProject
   */
  static create(props: CreateRecentProjectProps): RecentProject {
    const now = new Date();

    return new RecentProject({
      id: crypto.randomUUID(),
      path: props.path,
      name: props.name,
      gameVersion: props.gameVersion ?? null,
      screenshotPath: props.screenshotPath ?? null,
      trechoCount: props.trechoCount ?? null,
      lastOpenedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute a RecentProject from persistence
   */
  static fromPersistence(props: RecentProjectProps): RecentProject {
    return new RecentProject(props);
  }

  private validate(): void {
    // Business rule: Trecho count must be non-negative if provided
    if (this._trechoCount !== null && this._trechoCount < 0) {
      throw new DomainError('Trecho count cannot be negative');
    }

    // Additional validations are handled by Value Objects
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get path(): string {
    return this._path.toString();
  }

  get pathVO(): RecentProjectPath {
    return this._path;
  }

  get name(): string {
    return this._name.toString();
  }

  get nameVO(): RecentProjectName {
    return this._name;
  }

  get gameVersion(): string | null {
    return this._gameVersion?.toString() ?? null;
  }

  get gameVersionVO(): GameVersion | null {
    return this._gameVersion;
  }

  get screenshotPath(): string | null {
    return this._screenshotPath;
  }

  get trechoCount(): number | null {
    return this._trechoCount;
  }

  get lastOpenedAt(): Date {
    return new Date(this._lastOpenedAt);
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  // Business Methods

  /**
   * Update the last opened timestamp
   * Called when a project is reopened
   */
  updateLastOpened(): RecentProject {
    const now = new Date();

    return new RecentProject({
      id: this._id,
      path: this._path.toString(),
      name: this._name.toString(),
      gameVersion: this._gameVersion?.toString() ?? null,
      screenshotPath: this._screenshotPath,
      trechoCount: this._trechoCount,
      lastOpenedAt: now,
      createdAt: this._createdAt,
      updatedAt: now,
    });
  }

  /**
   * Update project metadata
   */
  updateMetadata(props: {
    name?: string;
    gameVersion?: string;
    screenshotPath?: string;
    trechoCount?: number;
  }): RecentProject {
    return new RecentProject({
      id: this._id,
      path: this._path.toString(),
      name: props.name ?? this._name.toString(),
      gameVersion: props.gameVersion ?? this._gameVersion?.toString() ?? null,
      screenshotPath: props.screenshotPath ?? this._screenshotPath,
      trechoCount: props.trechoCount ?? this._trechoCount,
      lastOpenedAt: this._lastOpenedAt,
      createdAt: this._createdAt,
      updatedAt: new Date(),
    });
  }

  /**
   * Update trecho count
   */
  updateTrechoCount(count: number): RecentProject {
    if (count < 0) {
      throw new DomainError('Trecho count cannot be negative');
    }

    return new RecentProject({
      id: this._id,
      path: this._path.toString(),
      name: this._name.toString(),
      gameVersion: this._gameVersion?.toString() ?? null,
      screenshotPath: this._screenshotPath,
      trechoCount: count,
      lastOpenedAt: this._lastOpenedAt,
      createdAt: this._createdAt,
      updatedAt: new Date(),
    });
  }

  /**
   * Check if project was opened within the last N days
   */
  wasOpenedWithinDays(days: number): boolean {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this._lastOpenedAt >= cutoffDate;
  }

  /**
   * Check if project has a screenshot
   */
  hasScreenshot(): boolean {
    return this._screenshotPath !== null && this._screenshotPath.length > 0;
  }

  /**
   * Check if project has trecho data
   */
  hasTrechoData(): boolean {
    return this._trechoCount !== null && this._trechoCount > 0;
  }

  /**
   * Compare with another project by last opened date
   */
  isNewerThan(other: RecentProject): boolean {
    return this._lastOpenedAt > other._lastOpenedAt;
  }

  /**
   * Convert to plain object for persistence
   */
  toPersistence(): RecentProjectProps {
    return {
      id: this._id,
      path: this._path.toString(),
      name: this._name.toString(),
      gameVersion: this._gameVersion?.toString() ?? null,
      screenshotPath: this._screenshotPath,
      trechoCount: this._trechoCount,
      lastOpenedAt: this._lastOpenedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /**
   * Convert to JSON for API responses
   */
  toJSON() {
    return {
      id: this._id,
      path: this._path.toString(),
      name: this._name.toString(),
      gameVersion: this._gameVersion?.toString() ?? null,
      screenshotPath: this._screenshotPath,
      trechoCount: this._trechoCount,
      lastOpenedAt: this._lastOpenedAt.toISOString(),
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }

  equals(other: RecentProject): boolean {
    if (!(other instanceof RecentProject)) {
      return false;
    }

    return this._id === other._id;
  }
}
