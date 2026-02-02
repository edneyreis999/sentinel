import { Project, ProjectStatus } from '../entities/project.entity';
import { ProjectId } from '../value-objects/project-id.vo';
import { ProjectName } from '../value-objects/project-name.vo';
import { GddPath } from '../value-objects/gdd-path.vo';

type PropOrFactory<T> = T | ((index: number) => T);

export class ProjectFakeBuilder {
  private _id: PropOrFactory<string> = (index) =>
    `550e8400-e29b-41d4-a716-${String(index + 1).padStart(12, '0')}`;
  private _name: PropOrFactory<string> = (index) => `Test Project ${index + 1}`;
  private _gddPath: PropOrFactory<string> = (index) => `/gdds/project-${index + 1}.md`;
  private _status: PropOrFactory<ProjectStatus> = 'draft';
  private _description: PropOrFactory<string | undefined> = undefined;
  private _createdAt: PropOrFactory<Date> = () => new Date();
  private _updatedAt: PropOrFactory<Date> = () => new Date();

  static aProject(): ProjectFakeBuilder {
    return new ProjectFakeBuilder();
  }

  static theProjects(count: number): ProjectFakeBuilder {
    return new ProjectFakeBuilder();
  }

  withId(valueOrFactory: PropOrFactory<string>): this {
    this._id = valueOrFactory;
    return this;
  }

  withName(valueOrFactory: PropOrFactory<string>): this {
    this._name = valueOrFactory;
    return this;
  }

  withGddPath(valueOrFactory: PropOrFactory<string>): this {
    this._gddPath = valueOrFactory;
    return this;
  }

  withStatus(valueOrFactory: PropOrFactory<ProjectStatus>): this {
    this._status = valueOrFactory;
    return this;
  }

  withDescription(valueOrFactory: PropOrFactory<string | undefined>): this {
    this._description = valueOrFactory;
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

  private callFactory<T>(valueOrFactory: PropOrFactory<T>, index: number): T {
    return valueOrFactory instanceof Function ? valueOrFactory(index) : valueOrFactory;
  }

  build(index = 0): Project {
    const id = this.callFactory(this._id, index);
    const name = this.callFactory(this._name, index);
    const gddPath = this.callFactory(this._gddPath, index);
    const status = this.callFactory(this._status, index);
    const description = this.callFactory(this._description, index);
    const createdAt = this.callFactory(this._createdAt, index);
    const updatedAt = this.callFactory(this._updatedAt, index);

    return new Project({
      id: new ProjectId(id),
      name: new ProjectName(name),
      gddPath: new GddPath(gddPath),
      status,
      description,
      createdAt,
      updatedAt,
    });
  }

  buildMany(count: number): Project[] {
    return Array.from({ length: count }, (_, index) => this.build(index));
  }
}
