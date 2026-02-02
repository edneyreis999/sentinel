import { DomainError } from '../../../shared/domain/errors/domain.error';

export class ProjectId {
  private readonly value: string;

  constructor(value: string) {
    this.validate(value);
    this.value = value;
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new DomainError('Project ID cannot be empty');
    }

    if (value.length > 255) {
      throw new DomainError('Project ID cannot exceed 255 characters');
    }

    // Optional: Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new DomainError('Project ID must be a valid UUID');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: ProjectId): boolean {
    if (!(other instanceof ProjectId)) {
      return false;
    }
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
