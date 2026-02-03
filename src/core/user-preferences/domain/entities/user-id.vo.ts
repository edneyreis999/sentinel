/**
 * UserId Value Object
 *
 * Strongly typed identifier for UserPreferences aggregate.
 */
export class UserId {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value?: string): UserId {
    return new UserId(value || crypto.randomUUID());
  }

  static from(value: string): UserId {
    return new UserId(value);
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
