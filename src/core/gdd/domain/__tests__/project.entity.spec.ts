import { Project, ProjectStatus } from '../entities/project.entity';
import { ProjectId } from '../value-objects/project-id.vo';
import { ProjectName } from '../value-objects/project-name.vo';
import { GddPath } from '../value-objects/gdd-path.vo';
import { ProjectFakeBuilder } from './project.fake-builder';
import { DomainError } from '../../../shared/domain/errors/domain.error';

describe('Project Entity', () => {
  describe('instantiation', () => {
    it('should create a valid project with all properties', () => {
      const project = ProjectFakeBuilder.aProject().build();

      expect(project).toBeInstanceOf(Project);
      expect(project.id).toBeInstanceOf(ProjectId);
      expect(project.name).toBeInstanceOf(ProjectName);
      expect(project.gddPath).toBeInstanceOf(GddPath);
      expect(project.status).toBe('draft');
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
    });

    it('should create project with custom values', () => {
      const createdAt = new Date('2024-01-01T00:00:00Z');
      const updatedAt = new Date('2024-01-02T00:00:00Z');

      const project = new Project({
        id: new ProjectId('550e8400-e29b-41d4-a716-446655440000'),
        name: new ProjectName('Custom Project'),
        gddPath: new GddPath('/custom/path.md'),
        status: 'active',
        description: 'Custom description',
        createdAt,
        updatedAt,
      });

      expect(project.id.toString()).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(project.name.toString()).toBe('Custom Project');
      expect(project.gddPath.toString()).toBe('/custom/path.md');
      expect(project.status).toBe('active');
      expect(project.description).toBe('Custom description');
      expect(project.createdAt).toEqual(createdAt);
      expect(project.updatedAt).toEqual(updatedAt);
    });

    it('should default to draft status', () => {
      const project = new Project({
        id: new ProjectId('550e8400-e29b-41d4-a716-446655440000'),
        name: new ProjectName('Test Project'),
        gddPath: new GddPath('/test.md'),
      });

      expect(project.status).toBe('draft');
    });

    it('should default dates to now', () => {
      const before = new Date();
      const project = ProjectFakeBuilder.aProject().build();
      const after = new Date();

      expect(project.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(project.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(project.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(project.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should default updatedAt to createdAt when not provided', () => {
      const createdAt = new Date('2024-01-01T00:00:00Z');

      const project = new Project({
        id: new ProjectId('550e8400-e29b-41d4-a716-446655440000'),
        name: new ProjectName('Test Project'),
        gddPath: new GddPath('/test.md'),
        createdAt,
      });

      expect(project.updatedAt).toEqual(createdAt);
    });
  });

  describe('validation', () => {
    it('should throw DomainError when description exceeds 1000 characters', () => {
      expect(() => {
        new Project({
          id: new ProjectId('550e8400-e29b-41d4-a716-446655440000'),
          name: new ProjectName('Test Project'),
          gddPath: new GddPath('/test.md'),
          description: 'a'.repeat(1001),
        });
      }).toThrow(DomainError);

      expect(() => {
        new Project({
          id: new ProjectId('550e8400-e29b-41d4-a716-446655440000'),
          name: new ProjectName('Test Project'),
          gddPath: new GddPath('/test.md'),
          description: 'a'.repeat(1001),
        });
      }).toThrow('cannot exceed 1000 characters');
    });

    it('should accept description at exactly 1000 characters', () => {
      expect(() => {
        new Project({
          id: new ProjectId('550e8400-e29b-41d4-a716-446655440000'),
          name: new ProjectName('Test Project'),
          gddPath: new GddPath('/test.md'),
          description: 'a'.repeat(1000),
        });
      }).not.toThrow();
    });
  });

  describe('status methods', () => {
    it('should return correct status checks', () => {
      const draftProject = ProjectFakeBuilder.aProject().withStatus('draft').build();
      const activeProject = ProjectFakeBuilder.aProject().withStatus('active').build();
      const archivedProject = ProjectFakeBuilder.aProject().withStatus('archived').build();

      expect(draftProject.isDraft()).toBe(true);
      expect(draftProject.isActive()).toBe(false);
      expect(draftProject.isArchived()).toBe(false);

      expect(activeProject.isDraft()).toBe(false);
      expect(activeProject.isActive()).toBe(true);
      expect(activeProject.isArchived()).toBe(false);

      expect(archivedProject.isDraft()).toBe(false);
      expect(archivedProject.isActive()).toBe(false);
      expect(archivedProject.isArchived()).toBe(true);
    });
  });

  describe('rename method', () => {
    it('should rename project successfully', () => {
      const project = ProjectFakeBuilder.aProject().build();
      const newName = new ProjectName('Renamed Project');
      const oldUpdatedAt = project.updatedAt;

      // Wait a bit to ensure timestamp changes
      const startTime = new Date();
      setTimeout(() => {
        project.rename(newName);
        const endTime = new Date();

        expect(project.name.toString()).toBe('Renamed Project');
        expect(project.updatedAt.getTime()).toBeGreaterThan(startTime.getTime());
        expect(project.updatedAt.getTime()).toBeLessThanOrEqual(endTime.getTime());
      }, 10);
    });

    it('should throw DomainError when renaming archived project', () => {
      const project = ProjectFakeBuilder.aProject().withStatus('archived').build();
      const newName = new ProjectName('New Name');

      expect(() => project.rename(newName)).toThrow(DomainError);
      expect(() => project.rename(newName)).toThrow('Cannot rename archived project');
    });

    it('should preserve other properties when renaming', () => {
      const project = ProjectFakeBuilder.aProject()
        .withStatus('active')
        .withDescription('Original description')
        .build();
      const originalId = project.id.toString();
      const originalPath = project.gddPath.toString();
      const originalStatus = project.status;

      project.rename(new ProjectName('New Name'));

      expect(project.id.toString()).toBe(originalId);
      expect(project.gddPath.toString()).toBe(originalPath);
      expect(project.status).toBe(originalStatus);
      expect(project.description).toBe('Original description');
    });
  });

  describe('updateDescription method', () => {
    it('should update description successfully', () => {
      const project = ProjectFakeBuilder.aProject().build();
      const newDescription = 'Updated description';

      project.updateDescription(newDescription);

      expect(project.description).toBe(newDescription);
    });

    it('should throw DomainError when description exceeds 1000 characters', () => {
      const project = ProjectFakeBuilder.aProject().build();

      expect(() => project.updateDescription('a'.repeat(1001))).toThrow(DomainError);
      expect(() => project.updateDescription('a'.repeat(1001))).toThrow(
        'cannot exceed 1000 characters',
      );
    });

    it('should throw DomainError when updating archived project description', () => {
      const project = ProjectFakeBuilder.aProject().withStatus('archived').build();

      expect(() => project.updateDescription('New description')).toThrow(DomainError);
      expect(() => project.updateDescription('New description')).toThrow(
        'Cannot update description of archived project',
      );
    });

    it('should clear description when updating with empty string', () => {
      const project = ProjectFakeBuilder.aProject().withDescription('Original').build();

      project.updateDescription('');

      expect(project.description).toBe('');
    });
  });

  describe('activate method', () => {
    it('should activate draft project', () => {
      const project = ProjectFakeBuilder.aProject().withStatus('draft').build();

      project.activate();

      expect(project.status).toBe('active');
    });

    it('should keep active project as active', () => {
      const project = ProjectFakeBuilder.aProject().withStatus('active').build();

      expect(() => project.activate()).not.toThrow();
      expect(project.status).toBe('active');
    });

    it('should throw DomainError when activating archived project', () => {
      const project = ProjectFakeBuilder.aProject().withStatus('archived').build();

      expect(() => project.activate()).toThrow(DomainError);
      expect(() => project.activate()).toThrow('Cannot activate archived project');
    });

    it('should update timestamp when activating', () => {
      const project = ProjectFakeBuilder.aProject().withStatus('draft').build();
      const oldUpdatedAt = project.updatedAt;

      project.activate();

      expect(project.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
    });
  });

  describe('archive method', () => {
    it('should archive draft project', () => {
      const project = ProjectFakeBuilder.aProject().withStatus('draft').build();

      project.archive();

      expect(project.status).toBe('archived');
    });

    it('should archive active project', () => {
      const project = ProjectFakeBuilder.aProject().withStatus('active').build();

      project.archive();

      expect(project.status).toBe('archived');
    });

    it('should throw DomainError when archiving already archived project', () => {
      const project = ProjectFakeBuilder.aProject().withStatus('archived').build();

      expect(() => project.archive()).toThrow(DomainError);
      expect(() => project.archive()).toThrow('Project is already archived');
    });

    it('should update timestamp when archiving', () => {
      const project = ProjectFakeBuilder.aProject().withStatus('active').build();
      const oldUpdatedAt = project.updatedAt;

      project.archive();

      expect(project.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
    });
  });

  describe('equals method', () => {
    it('should return true when projects have same ID', () => {
      const id = new ProjectId('550e8400-e29b-41d4-a716-446655440000');
      const project1 = new Project({
        id,
        name: new ProjectName('Project 1'),
        gddPath: new GddPath('/project1.md'),
      });
      const project2 = new Project({
        id,
        name: new ProjectName('Project 2'),
        gddPath: new GddPath('/project2.md'),
      });

      expect(project1.equals(project2)).toBe(true);
    });

    it('should return false when projects have different IDs', () => {
      const project1 = ProjectFakeBuilder.aProject().build();
      const project2 = ProjectFakeBuilder.aProject()
        .withId('550e8400-e29b-41d4-a716-446655440001')
        .build();

      expect(project1.equals(project2)).toBe(false);
    });

    it('should return false when comparing with non-Project', () => {
      const project = ProjectFakeBuilder.aProject().build();

      expect(project.equals(null as any)).toBe(false);
      expect(project.equals(undefined as any)).toBe(false);
      expect(project.equals({ id: project.id } as any)).toBe(false);
    });
  });

  describe('toJSON method', () => {
    it('should serialize project to JSON', () => {
      const createdAt = new Date('2024-01-01T00:00:00Z');
      const updatedAt = new Date('2024-01-02T00:00:00Z');

      const project = new Project({
        id: new ProjectId('550e8400-e29b-41d4-a716-446655440000'),
        name: new ProjectName('Test Project'),
        gddPath: new GddPath('/test.md'),
        status: 'active',
        description: 'Test description',
        createdAt,
        updatedAt,
      });

      const json = project.toJSON();

      expect(json).toEqual({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Project',
        gddPath: '/test.md',
        status: 'active',
        description: 'Test description',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      });
    });

    it('should handle undefined description in JSON', () => {
      const project = ProjectFakeBuilder.aProject().build();

      const json = project.toJSON();

      expect(json.description).toBeUndefined();
    });
  });

  describe('date handling', () => {
    it('should return correct date values', () => {
      const originalCreatedAt = new Date('2024-01-01T00:00:00Z');
      const originalUpdatedAt = new Date('2024-01-02T00:00:00Z');

      const project = new Project({
        id: new ProjectId('550e8400-e29b-41d4-a716-446655440000'),
        name: new ProjectName('Test Project'),
        gddPath: new GddPath('/test.md'),
        createdAt: originalCreatedAt,
        updatedAt: originalUpdatedAt,
      });

      expect(project.createdAt.toISOString()).toBe('2024-01-01T00:00:00.000Z');
      expect(project.updatedAt.toISOString()).toBe('2024-01-02T00:00:00.000Z');
    });

    it('should return new Date instances from getters', () => {
      const project = ProjectFakeBuilder.aProject().build();

      const date1 = project.createdAt;
      const date2 = project.createdAt;

      // Each call to the getter returns a new Date instance
      expect(date1).not.toBe(date2);
      // But they have the same value
      expect(date1.getTime()).toBe(date2.getTime());
    });
  });

  describe('FakeBuilder integration', () => {
    it('should work with FakeBuilder for test data generation', () => {
      const projects = ProjectFakeBuilder.theProjects(5).buildMany(5);

      expect(projects).toHaveLength(5);

      // All projects should have unique IDs
      const ids = projects.map((p) => p.id.toString());
      expect(new Set(ids).size).toBe(5);
    });

    it('should support overriding properties via FakeBuilder', () => {
      const project = ProjectFakeBuilder.aProject()
        .withName('Custom Name')
        .withStatus('active')
        .build();

      expect(project.name.toString()).toBe('Custom Name');
      expect(project.status).toBe('active');
    });
  });
});
