import { DomainError } from '@core/shared/domain/errors';

/**
 * RecentProjectPath Value Object
 *
 * Encapsulates validation and normalization of project paths.
 * Ensures consistent path handling across Windows and Unix systems.
 */
export class RecentProjectPath {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): RecentProjectPath {
    if (!value || typeof value !== 'string') {
      throw new DomainError('Project path is required and must be a string');
    }

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new DomainError('Project path cannot be empty');
    }

    // Normalize path separators to forward slashes
    const normalized = trimmed.replace(/\\/g, '/');

    // Validate path format (basic validation for common patterns)
    if (!this.isValidPath(normalized)) {
      throw new DomainError(
        `Invalid project path format: "${value}". Path must be a valid file system path.`,
      );
    }

    return new RecentProjectPath(normalized);
  }

  private static isValidPath(path: string): boolean {
    // Basic validation: allow alphanumeric, hyphens, underscores, dots, forward slashes, and colons (for Windows drives)
    const validPattern = /^[a-zA-Z]:?\/[\/\w\-.]*$/;

    // Also accept relative paths
    const relativePattern = /^\.?\.?\/[\/\w\-.]*$/;

    return validPattern.test(path) || relativePattern.test(path) || /^[a-zA-Z]:\\/.test(path);
  }

  toString(): string {
    return this.value;
  }

  equals(other: RecentProjectPath): boolean {
    if (!(other instanceof RecentProjectPath)) {
      return false;
    }

    // Case-insensitive comparison for Windows compatibility
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  /**
   * Check if this is a Windows absolute path
   */
  isWindowsPath(): boolean {
    return /^[a-zA-Z]:/.test(this.value);
  }

  /**
   * Check if this is a Unix absolute path
   */
  isUnixPath(): boolean {
    return this.value.startsWith('/');
  }

  /**
   * Check if this is a relative path
   */
  isRelativePath(): boolean {
    return this.value.startsWith('./') || this.value.startsWith('../');
  }

  /**
   * Get the file extension if present
   */
  getExtension(): string | null {
    const match = this.value.match(/\.([^.\/\\]+)$/);
    return match ? match[1] : null;
  }

  /**
   * Get the directory name
   */
  getDirectoryName(): string {
    const parts = this.value.split('/');
    parts.pop(); // Remove file name
    return parts.join('/') || '.';
  }

  /**
   * Get the file name without path
   */
  getFileName(): string {
    const parts = this.value.split('/');
    return parts[parts.length - 1] || this.value;
  }
}
