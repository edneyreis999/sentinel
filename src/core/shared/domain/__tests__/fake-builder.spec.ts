/**
 * FakeBuilder with PropOrFactory Pattern
 *
 * This test file documents and validates the FakeBuilder pattern
 * that should be used across the project for generating test data.
 *
 * Reference: docs/adrs/TEST/ADR-001-fakebuilder-with-proporfactory-pattern.md
 */

// Type definition for the PropOrFactory pattern
type PropOrFactory<T> = T | ((index: number) => T);

// Example Entity for RAG system
interface Project {
  id: string;
  name: string;
  description: string;
  gddPath: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'active' | 'archived';
}

// Example FakeBuilder implementation
class ProjectFakeBuilder {
  private _id: PropOrFactory<string> = (index) => `project-${index + 1}`;
  private _name: PropOrFactory<string> = (index) => `Test Project ${index + 1}`;
  private _description: PropOrFactory<string> = 'Test project description';
  private _gddPath: PropOrFactory<string> = (index) => `/gdds/project-${index + 1}`;
  private _createdAt: PropOrFactory<Date> = () => new Date();
  private _updatedAt: PropOrFactory<Date> = () => new Date();
  private _status: PropOrFactory<Project['status']> = 'draft';

  static aProject(): ProjectFakeBuilder {
    return new ProjectFakeBuilder();
  }

  static theProjects(count: number): ProjectFakeBuilder {
    return new ProjectFakeBuilder().withCount(count);
  }

  withId(valueOrFactory: PropOrFactory<string>): this {
    this._id = valueOrFactory;
    return this;
  }

  withName(valueOrFactory: PropOrFactory<string>): this {
    this._name = valueOrFactory;
    return this;
  }

  withDescription(valueOrFactory: PropOrFactory<string>): this {
    this._description = valueOrFactory;
    return this;
  }

  withGddPath(valueOrFactory: PropOrFactory<string>): this {
    this._gddPath = valueOrFactory;
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

  withStatus(valueOrFactory: PropOrFactory<Project['status']>): this {
    this._status = valueOrFactory;
    return this;
  }

  private withCount(_count: number): this {
    // This is a marker method for buildMany()
    return this;
  }

  private callFactory<T>(valueOrFactory: PropOrFactory<T>, index: number): T {
    return valueOrFactory instanceof Function ? valueOrFactory(index) : valueOrFactory;
  }

  build(index = 0): Project {
    return {
      id: this.callFactory(this._id, index),
      name: this.callFactory(this._name, index),
      description: this.callFactory(this._description, index),
      gddPath: this.callFactory(this._gddPath, index),
      createdAt: this.callFactory(this._createdAt, index),
      updatedAt: this.callFactory(this._updatedAt, index),
      status: this.callFactory(this._status, index),
    };
  }

  buildMany(count: number): Project[] {
    return Array.from({ length: count }, (_, index) => this.build(index));
  }
}

describe('FakeBuilder with PropOrFactory Pattern', () => {
  describe('pattern documentation', () => {
    it('should document the PropOrFactory type', () => {
      // PropOrFactory allows properties to be either:
      // 1. A static value: 'fixed-value'
      // 2. A factory function: (index: number) => `dynamic-${index}`

      const staticValue: PropOrFactory<string> = 'fixed';
      const factoryFunction: PropOrFactory<string> = (index) => `dynamic-${index}`;

      expect(staticValue).toBe('fixed');
      expect(factoryFunction(0)).toBe('dynamic-0');
      expect(factoryFunction(1)).toBe('dynamic-1');
    });

    it('should document the builder pattern benefits', () => {
      // Benefits:
      // 1. Sensible defaults for all properties
      // 2. Override only what you need for the test
      // 3. Fluent API for readability
      // 4. Generate multiple unique entities via buildMany()

      const project1 = ProjectFakeBuilder.aProject().build();
      const project2 = ProjectFakeBuilder.aProject()
        .withName('Custom Project')
        .withStatus('active')
        .build();

      expect(project1.name).toBe('Test Project 1');
      expect(project2.name).toBe('Custom Project');
      expect(project2.status).toBe('active');
    });
  });

  describe('basic builder usage', () => {
    it('should create entity with default values', () => {
      const project = ProjectFakeBuilder.aProject().build();

      expect(project.id).toBe('project-1');
      expect(project.name).toBe('Test Project 1');
      expect(project.description).toBe('Test project description');
      expect(project.gddPath).toBe('/gdds/project-1');
      expect(project.status).toBe('draft');
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
    });

    it('should override single property with static value', () => {
      const project = ProjectFakeBuilder.aProject().withName('Custom Name').build();

      expect(project.name).toBe('Custom Name');
      expect(project.id).toBe('project-1'); // Other defaults preserved
    });

    it('should override multiple properties with method chaining', () => {
      const project = ProjectFakeBuilder.aProject()
        .withName('Custom Name')
        .withDescription('Custom description')
        .withStatus('active')
        .build();

      expect(project.name).toBe('Custom Name');
      expect(project.description).toBe('Custom description');
      expect(project.status).toBe('active');
      expect(project.id).toBe('project-1');
    });

    it('should support method chaining', () => {
      const builder = ProjectFakeBuilder.aProject();
      const chained = builder.withName('Name').withDescription('Description').withStatus('active');

      expect(chained).toBe(builder); // Returns this for chaining
    });
  });

  describe('factory functions for dynamic values', () => {
    it('should use factory function to generate unique values', () => {
      const projects = ProjectFakeBuilder.aProject().buildMany(3);

      expect(projects[0].id).toBe('project-1');
      expect(projects[1].id).toBe('project-2');
      expect(projects[2].id).toBe('project-3');

      expect(projects[0].name).toBe('Test Project 1');
      expect(projects[1].name).toBe('Test Project 2');
      expect(projects[2].name).toBe('Test Project 3');
    });

    it('should support custom factory functions', () => {
      const projects = ProjectFakeBuilder.aProject()
        .withName((index) => `Factory Project ${index * 10}`)
        .buildMany(3);

      expect(projects[0].name).toBe('Factory Project 0');
      expect(projects[1].name).toBe('Factory Project 10');
      expect(projects[2].name).toBe('Factory Project 20');
    });

    it('should mix static values and factory functions', () => {
      const projects = ProjectFakeBuilder.aProject()
        .withStatus('active') // Static
        .withName((index) => `Project ${index}`) // Factory
        .buildMany(3);

      projects.forEach((p) => {
        expect(p.status).toBe('active');
      });
      expect(projects[0].name).toBe('Project 0');
      expect(projects[1].name).toBe('Project 1');
      expect(projects[2].name).toBe('Project 2');
    });
  });

  describe('buildMany for multiple entities', () => {
    it('should generate multiple unique entities', () => {
      const projects = ProjectFakeBuilder.aProject().buildMany(5);

      expect(projects).toHaveLength(5);

      // Verify all IDs are unique
      const ids = projects.map((p) => p.id);
      expect(new Set(ids).size).toBe(5);

      // Verify factory function was called with correct index
      expect(projects[0].id).toBe('project-1');
      expect(projects[4].id).toBe('project-5');
    });

    it('should handle buildMany with count 1', () => {
      const projects = ProjectFakeBuilder.aProject().buildMany(1);

      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe('project-1');
    });

    it('should handle buildMany with count 0', () => {
      const projects = ProjectFakeBuilder.aProject().buildMany(0);

      expect(projects).toHaveLength(0);
    });

    it('should apply overrides to all entities in buildMany', () => {
      const projects = ProjectFakeBuilder.aProject()
        .withStatus('active')
        .withDescription('Shared description')
        .buildMany(3);

      expect(projects).toHaveLength(3);
      projects.forEach((p) => {
        expect(p.status).toBe('active');
        expect(p.description).toBe('Shared description');
      });
    });
  });

  describe('immutability', () => {
    it('should create independent entities', () => {
      const project1 = ProjectFakeBuilder.aProject().build();
      const project2 = ProjectFakeBuilder.aProject().build();

      // Modify project1
      project1.name = 'Modified';

      expect(project1.name).toBe('Modified');
      expect(project2.name).toBe('Test Project 1'); // Unaffected
    });

    it('should not affect builder after build', () => {
      const builder = ProjectFakeBuilder.aProject();
      const project1 = builder.build();

      // Modify the built entity
      project1.name = 'Modified';

      // Builder creates fresh entity
      const project2 = builder.build();
      expect(project2.name).toBe('Test Project 1');
    });

    it('should create independent arrays from buildMany', () => {
      const builder = ProjectFakeBuilder.aProject();
      const batch1 = builder.buildMany(3);
      const batch2 = builder.buildMany(3);

      // Modify batch1
      batch1[0].name = 'Modified';

      expect(batch1[0].name).toBe('Modified');
      expect(batch2[0].name).toBe('Test Project 1'); // Unaffected
    });
  });

  describe('test readability', () => {
    it('should make test intent clear with descriptive builder methods', () => {
      // Anti-pattern: Inline object literal (verbose, hard to read)
      const project1: Project = {
        id: 'project-1',
        name: 'Test Project',
        description: 'A test project',
        gddPath: '/gdds/test',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'draft',
      };

      // Good pattern: FakeBuilder (concise, intent-focused)
      const project2 = ProjectFakeBuilder.aProject().build();

      expect(project1).toBeDefined();
      expect(project2).toBeDefined();
    });

    it('should focus test on relevant properties', () => {
      // Test focuses only on status validation, other fields use defaults
      const activeProject = ProjectFakeBuilder.aProject().withStatus('active').build();

      const draftProject = ProjectFakeBuilder.aProject().withStatus('draft').build();

      expect(activeProject.status).toBe('active');
      expect(draftProject.status).toBe('draft');
    });

    it('should support data variation in tests', () => {
      const testCases = [
        { status: 'draft' as const, description: 'Draft project' },
        { status: 'active' as const, description: 'Active project' },
        { status: 'archived' as const, description: 'Archived project' },
      ];

      testCases.forEach(({ status, description }) => {
        const project = ProjectFakeBuilder.aProject()
          .withStatus(status)
          .withDescription(description)
          .build();

        expect(project.status).toBe(status);
        expect(project.description).toBe(description);
      });
    });
  });

  describe('complex types with factory functions', () => {
    it('should handle Date factory functions', () => {
      const baseDate = new Date('2024-01-01T00:00:00Z');

      const projects = ProjectFakeBuilder.aProject()
        .withCreatedAt((index) => new Date(baseDate.getTime() + index * 86400000))
        .buildMany(3);

      expect(projects[0].createdAt.toISOString()).toBe('2024-01-01T00:00:00.000Z');
      expect(projects[1].createdAt.toISOString()).toBe('2024-01-02T00:00:00.000Z');
      expect(projects[2].createdAt.toISOString()).toBe('2024-01-03T00:00:00.000Z');
    });

    it('should handle enum-like types', () => {
      const statuses: Project['status'][] = ['draft', 'active', 'archived'];

      const projects = ProjectFakeBuilder.aProject()
        .withStatus((index) => statuses[index % statuses.length])
        .buildMany(5);

      expect(projects[0].status).toBe('draft');
      expect(projects[1].status).toBe('active');
      expect(projects[2].status).toBe('archived');
      expect(projects[3].status).toBe('draft');
      expect(projects[4].status).toBe('active');
    });
  });

  describe('integration test patterns', () => {
    it('should support testing collection operations', () => {
      const projects = ProjectFakeBuilder.aProject().buildMany(10);

      const activeProjects = projects.filter((p) => p.status === 'draft');

      expect(activeProjects).toHaveLength(10);
    });

    it('should support testing with specific data setup', () => {
      const activeProject = ProjectFakeBuilder.aProject()
        .withName('Active Project')
        .withStatus('active')
        .build();

      const archivedProject = ProjectFakeBuilder.aProject()
        .withName('Archived Project')
        .withStatus('archived')
        .build();

      expect(activeProject.status).toBe('active');
      expect(archivedProject.status).toBe('archived');
      expect(activeProject.name).not.toBe(archivedProject.name);
    });
  });
});
