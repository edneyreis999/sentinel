import { DomainError } from '@core/shared/domain/errors';

/**
 * RecentProjectName Value Object
 *
 * Encapsulates validation of project names.
 * Ensures names are meaningful and within acceptable length limits.
 */
export class RecentProjectName {
  private static readonly MAX_LENGTH = 255;
  private static readonly MIN_LENGTH = 1;
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): RecentProjectName {
    if (!value || typeof value !== 'string') {
      throw new DomainError('Project name is required and must be a string');
    }

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new DomainError('Project name cannot be empty');
    }

    if (trimmed.length > RecentProjectName.MAX_LENGTH) {
      throw new DomainError(
        `Project name cannot exceed ${RecentProjectName.MAX_LENGTH} characters`,
      );
    }

    // Check for invalid characters (control characters)
    if (/[\x00-\x1F\x7F]/.test(trimmed)) {
      throw new DomainError('Project name contains invalid characters');
    }

    return new RecentProjectName(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: RecentProjectName): boolean {
    if (!(other instanceof RecentProjectName)) {
      return false;
    }

    return this.value === other.value;
  }

  /**
   * Check if name contains a specific substring (case-insensitive)
   */
  contains(searchTerm: string): boolean {
    return this.value.toLowerCase().includes(searchTerm.toLowerCase());
  }

  /**
   * Get the length of the name
   */
  getLength(): number {
    return this.value.length;
  }

  /**
   * Get initials (first letter of each word, max 3 letters)
   */
  getInitials(): string {
    return this.value
      .split(/\s+/)
      .filter((word) => word.length > 0)
      .map((word) => word[0].toUpperCase())
      .slice(0, 3)
      .join('');
  }
}
