import { DomainError } from '../../../shared/domain/errors/domain.error';

export class ProjectName {
  private readonly value: string;

  constructor(value: string) {
    this.validate(value);
    this.value = value.trim();
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new DomainError('Project name cannot be empty');
    }

    const trimmed = value.trim();
    if (trimmed.length < 3) {
      throw new DomainError('Project name must be at least 3 characters long');
    }

    if (trimmed.length > 100) {
      throw new DomainError('Project name cannot exceed 100 characters');
    }

    // Check for meaningful content (not just whitespace)
    if (!trimmed || /^\s*$/.test(trimmed)) {
      throw new DomainError('Project name cannot be only whitespace');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: ProjectName): boolean {
    if (!(other instanceof ProjectName)) {
      return false;
    }
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  toString(): string {
    return this.value;
  }
}
