import { DomainError } from '../../../shared/domain/errors/domain.error';

export class GddPath {
  private readonly value: string;

  constructor(value: string) {
    this.validate(value);
    this.value = value;
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new DomainError('GDD path cannot be empty');
    }

    const trimmed = value.trim();

    // Must start with /
    if (!trimmed.startsWith('/')) {
      throw new DomainError('GDD path must start with /');
    }

    // Must end with a valid file extension or directory
    if (trimmed.length > 1 && !trimmed.endsWith('.md') && !trimmed.endsWith('.json') && !trimmed.endsWith('/')) {
      throw new DomainError('GDD path must end with .md, .json, or /');
    }

    // Check for invalid characters
    const invalidChars = /[<>:"|?*\x00-\x1F]/;
    if (invalidChars.test(trimmed)) {
      throw new DomainError('GDD path contains invalid characters');
    }

    // Check for double slashes (except for protocol)
    if (trimmed.includes('//')) {
      throw new DomainError('GDD path cannot contain consecutive slashes');
    }

    if (trimmed.length > 500) {
      throw new DomainError('GDD path cannot exceed 500 characters');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: GddPath): boolean {
    if (!(other instanceof GddPath)) {
      return false;
    }
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  getExtension(): string | null {
    if (this.value.endsWith('.md')) return 'md';
    if (this.value.endsWith('.json')) return 'json';
    if (this.value.endsWith('/')) return 'directory';
    return null;
  }

  isDirectory(): boolean {
    return this.value.endsWith('/');
  }

  getParentPath(): GddPath {
    // Remove trailing slash if present for consistent splitting
    const normalizedPath = this.value.endsWith('/') && this.value.length > 1
      ? this.value.slice(0, -1)
      : this.value;

    const parts = normalizedPath.split('/');
    parts.pop(); // Remove last element (filename or last directory)

    // If we're at root or the path becomes empty, return root
    if (parts.length <= 1 || parts.every((p) => p === '')) {
      return new GddPath('/');
    }

    // Ensure the parent path ends with / for directories
    const parentPath = parts.join('/') + '/';
    return new GddPath(parentPath);
  }
}
