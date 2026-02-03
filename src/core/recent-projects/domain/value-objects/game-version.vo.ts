import { DomainError } from '@core/shared/domain/errors';

/**
 * GameVersion Value Object
 *
 * Encapsulates validation and comparison of game version strings.
 * Supports semantic versioning (e.g., "1.0.0", "2.1.3-beta").
 */
export class GameVersion {
  private readonly VERSION_PATTERN =
    /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][a-zA-Z0-9-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][a-zA-Z0-9-]*))*))?(?:\+([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*))?$/;

  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string | null): GameVersion {
    if (value === null || value === undefined || value === '') {
      throw new DomainError(
        'Game version cannot be null or empty. Expected semantic versioning format (e.g., "1.0.0").',
      );
    }

    const trimmed = value.trim();

    if (!GameVersion.isValidVersion(trimmed)) {
      throw new DomainError(
        `Invalid game version format: "${value}". Expected semantic versioning format (e.g., "1.0.0").`,
      );
    }

    return new GameVersion(trimmed);
  }

  private static isValidVersion(version: string): boolean {
    const VERSION_PATTERN =
      /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][a-zA-Z0-9-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][a-zA-Z0-9-]*))*))?(?:\+([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*))?$/;
    return VERSION_PATTERN.test(version);
  }

  toString(): string {
    return this.value;
  }

  equals(other: GameVersion | null): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    if (!(other instanceof GameVersion)) {
      return false;
    }

    return this.value === other.value;
  }

  /**
   * Parse version into components
   */
  parse(): { major: number; minor: number; patch: number; prerelease?: string; build?: string } {
    const match = this.value.match(this.VERSION_PATTERN);

    if (!match) {
      throw new Error('Failed to parse version');
    }

    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4],
      build: match[5],
    };
  }

  /**
   * Compare this version with another
   * Returns: -1 if this < other, 0 if equal, 1 if this > other
   */
  compare(other: GameVersion): number {
    const thisVersion = this.parse();
    const otherVersion = other.parse();

    if (thisVersion.major !== otherVersion.major) {
      return thisVersion.major > otherVersion.major ? 1 : -1;
    }

    if (thisVersion.minor !== otherVersion.minor) {
      return thisVersion.minor > otherVersion.minor ? 1 : -1;
    }

    if (thisVersion.patch !== otherVersion.patch) {
      return thisVersion.patch > otherVersion.patch ? 1 : -1;
    }

    // Prerelease versions come before normal versions
    const thisHasPrerelease = thisVersion.prerelease !== undefined;
    const otherHasPrerelease = otherVersion.prerelease !== undefined;

    if (thisHasPrerelease && !otherHasPrerelease) {
      return -1;
    }

    if (!thisHasPrerelease && otherHasPrerelease) {
      return 1;
    }

    return 0;
  }

  /**
   * Check if this version is greater than another
   */
  isGreaterThan(other: GameVersion): boolean {
    return this.compare(other) > 0;
  }

  /**
   * Check if this version is less than another
   */
  isLessThan(other: GameVersion): boolean {
    return this.compare(other) < 0;
  }

  /**
   * Get major version number
   */
  getMajor(): number {
    return this.parse().major;
  }

  /**
   * Get minor version number
   */
  getMinor(): number {
    return this.parse().minor;
  }

  /**
   * Get patch version number
   */
  getPatch(): number {
    return this.parse().patch;
  }

  /**
   * Check if this is a prerelease version
   */
  isPrerelease(): boolean {
    return this.parse().prerelease !== undefined;
  }
}
