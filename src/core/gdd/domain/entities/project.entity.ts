import { ProjectId } from '../value-objects/project-id.vo';
import { ProjectName } from '../value-objects/project-name.vo';
import { GddPath } from '../value-objects/gdd-path.vo';
import { DomainError } from '../../../shared/domain/errors/domain.error';

export type ProjectStatus = 'draft' | 'active' | 'archived';

export class Project {
  private readonly _id: ProjectId;
  private _name: ProjectName;
  private readonly _gddPath: GddPath;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _status: ProjectStatus;
  private _description?: string;

  constructor(props: {
    id: ProjectId;
    name: ProjectName;
    gddPath: GddPath;
    status?: ProjectStatus;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this._id = props.id;
    this._name = props.name;
    this._gddPath = props.gddPath;
    this._status = props.status || 'draft';
    this._description = props.description;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || this._createdAt;

    this.validate();
  }

  private validate(): void {
    // Business rule: Description must not exceed 1000 characters
    if (this._description && this._description.length > 1000) {
      throw new DomainError('Project description cannot exceed 1000 characters');
    }

    // Business rule: Draft projects cannot be archived directly
    if (this._status === 'archived' && !this._updatedAt) {
      throw new DomainError('Draft projects cannot be archived');
    }
  }

  // Getters
  get id(): ProjectId {
    return this._id;
  }

  get name(): ProjectName {
    return this._name;
  }

  get gddPath(): GddPath {
    return this._gddPath;
  }

  get status(): ProjectStatus {
    return this._status;
  }

  get description(): string | undefined {
    return this._description;
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  // Business methods
  rename(newName: ProjectName): void {
    if (this._status === 'archived') {
      throw new DomainError('Cannot rename archived project');
    }

    this._name = newName;
    this._updatedAt = new Date();
  }

  updateDescription(description: string): void {
    if (this._status === 'archived') {
      throw new DomainError('Cannot update description of archived project');
    }

    if (description.length > 1000) {
      throw new DomainError('Project description cannot exceed 1000 characters');
    }

    this._description = description;
    this._updatedAt = new Date();
  }

  activate(): void {
    if (this._status === 'archived') {
      throw new DomainError('Cannot activate archived project');
    }

    this._status = 'active';
    this._updatedAt = new Date();
  }

  archive(): void {
    if (this._status === 'archived') {
      throw new DomainError('Project is already archived');
    }

    this._status = 'archived';
    this._updatedAt = new Date();
  }

  isDraft(): boolean {
    return this._status === 'draft';
  }

  isActive(): boolean {
    return this._status === 'active';
  }

  isArchived(): boolean {
    return this._status === 'archived';
  }

  equals(other: Project): boolean {
    if (!(other instanceof Project)) {
      return false;
    }
    return this._id.equals(other.id);
  }

  toJSON() {
    return {
      id: this._id.toString(),
      name: this._name.toString(),
      gddPath: this._gddPath.toString(),
      status: this._status,
      description: this._description,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }
}
