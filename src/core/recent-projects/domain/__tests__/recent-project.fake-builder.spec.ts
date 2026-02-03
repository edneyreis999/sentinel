import { RecentProjectFakeBuilder } from '../recent-project.fake-builder';

describe('RecentProjectFakeBuilder', () => {
  describe('basic builder usage', () => {
    it('should create project with default values', () => {
      const project = RecentProjectFakeBuilder.aRecentProject().build();

      expect(project.id).toBeDefined();
      expect(project.path).toContain('sentinel-project-1');
      expect(project.name).toContain('Sentinel Project 1');
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
      expect(project.lastOpenedAt).toBeInstanceOf(Date);
    });

    it('should override single property with static value', () => {
      const project = RecentProjectFakeBuilder.aRecentProject().withName('Custom Project').build();

      expect(project.name).toBe('Custom Project');
      expect(project.path).toContain('sentinel-project-1');
    });

    it('should override multiple properties with method chaining', () => {
      const project = RecentProjectFakeBuilder.aRecentProject()
        .withName('Custom Name')
        .withGameVersion('2.0.0')
        .withTrechoCount(50)
        .build();

      expect(project.name).toBe('Custom Name');
      expect(project.gameVersion).toBe('2.0.0');
      expect(project.trechoCount).toBe(50);
    });

    it('should support method chaining', () => {
      const builder = RecentProjectFakeBuilder.aRecentProject();
      const chained = builder.withName('Name').withGameVersion('1.0.0').withTrechoCount(10);

      expect(chained).toBe(builder);
    });
  });

  describe('factory functions for dynamic values', () => {
    it('should use factory function to generate unique IDs', () => {
      const projects = RecentProjectFakeBuilder.aRecentProject().buildMany(3);

      const ids = projects.map((p) => p.id);
      expect(new Set(ids).size).toBe(3);
    });

    it('should use factory function to generate unique paths', () => {
      const projects = RecentProjectFakeBuilder.aRecentProject().buildMany(3);

      expect(projects[0].path).toContain('sentinel-project-1');
      expect(projects[1].path).toContain('sentinel-project-2');
      expect(projects[2].path).toContain('sentinel-project-3');
    });

    it('should use factory function to generate unique names', () => {
      const projects = RecentProjectFakeBuilder.aRecentProject().buildMany(3);

      expect(projects[0].name).toContain('Sentinel Project 1');
      expect(projects[1].name).toContain('Sentinel Project 2');
      expect(projects[2].name).toContain('Sentinel Project 3');
    });

    it('should support custom factory functions', () => {
      const projects = RecentProjectFakeBuilder.aRecentProject()
        .withName((index) => `Factory Project ${index * 10}`)
        .buildMany(3);

      expect(projects[0].name).toBe('Factory Project 0');
      expect(projects[1].name).toBe('Factory Project 10');
      expect(projects[2].name).toBe('Factory Project 20');
    });

    it('should cycle through game versions', () => {
      const projects = RecentProjectFakeBuilder.aRecentProject().buildMany(5);

      expect(projects[0].gameVersion).toBe('1.0.0');
      expect(projects[1].gameVersion).toBe('1.1.0');
      expect(projects[2].gameVersion).toBe('1.2.0');
      expect(projects[3].gameVersion).toBe('2.0.0');
      expect(projects[4].gameVersion).toBeNull();
    });

    it('should generate timestamps in descending order', () => {
      const projects = RecentProjectFakeBuilder.aRecentProject().buildMany(3);

      expect(projects[0].lastOpenedAt.getTime()).toBeGreaterThan(
        projects[1].lastOpenedAt.getTime(),
      );
      expect(projects[1].lastOpenedAt.getTime()).toBeGreaterThan(
        projects[2].lastOpenedAt.getTime(),
      );
    });
  });

  describe('buildMany for multiple entities', () => {
    it('should generate multiple unique entities', () => {
      const projects = RecentProjectFakeBuilder.aRecentProject().buildMany(5);

      expect(projects).toHaveLength(5);

      const paths = projects.map((p) => p.path);
      expect(new Set(paths).size).toBe(5);
    });

    it('should handle buildMany with count 1', () => {
      const projects = RecentProjectFakeBuilder.aRecentProject().buildMany(1);

      expect(projects).toHaveLength(1);
      expect(projects[0].path).toContain('sentinel-project-1');
    });

    it('should handle buildMany with count 0', () => {
      const projects = RecentProjectFakeBuilder.aRecentProject().buildMany(0);

      expect(projects).toHaveLength(0);
    });

    it('should apply overrides to all entities in buildMany', () => {
      const projects = RecentProjectFakeBuilder.aRecentProject()
        .withGameVersion('3.0.0')
        .withTrechoCount(100)
        .buildMany(3);

      expect(projects).toHaveLength(3);
      projects.forEach((p) => {
        expect(p.gameVersion).toBe('3.0.0');
        expect(p.trechoCount).toBe(100);
      });
    });
  });

  describe('immutability', () => {
    it('should create independent entities', () => {
      const project1 = RecentProjectFakeBuilder.aRecentProject().build();
      const project2 = RecentProjectFakeBuilder.aRecentProject().build();

      // Since projects are immutable, this comparison is for ID equality
      expect(project1.id).not.toBe(project2.id);
    });

    it('should not affect builder after build', () => {
      const builder = RecentProjectFakeBuilder.aRecentProject();
      const project1 = builder.build();

      const project2 = builder.build();

      // Builder creates fresh entities with same defaults
      expect(project1.id).not.toBe(project2.id);
    });

    it('should create independent arrays from buildMany', () => {
      const builder = RecentProjectFakeBuilder.aRecentProject();
      const batch1 = builder.buildMany(3);
      const batch2 = builder.buildMany(3);

      const ids1 = batch1.map((p) => p.id);
      const ids2 = batch2.map((p) => p.id);

      // IDs should be different since UUID is generated fresh
      expect(ids1).not.toEqual(ids2);
    });
  });

  describe('test data helpers', () => {
    it('should create project with null values', () => {
      const project = RecentProjectFakeBuilder.aRecentProject()
        .withGameVersion(null)
        .withScreenshotPath(null)
        .withTrechoCount(null)
        .build();

      expect(project.gameVersion).toBeNull();
      expect(project.screenshotPath).toBeNull();
      expect(project.trechoCount).toBeNull();
    });

    it('should create project with specific dates', () => {
      const date = new Date('2024-01-01T00:00:00Z');

      const project = RecentProjectFakeBuilder.aRecentProject()
        .withLastOpenedAt(date)
        .withCreatedAt(date)
        .build();

      expect(project.lastOpenedAt).toEqual(date);
      expect(project.createdAt).toEqual(date);
    });
  });

  describe('static factory methods', () => {
    it('should provide aRecentProject factory', () => {
      const builder = RecentProjectFakeBuilder.aRecentProject();

      expect(builder).toBeInstanceOf(RecentProjectFakeBuilder);
    });

    it('should provide theRecentProjects factory', () => {
      const builder = RecentProjectFakeBuilder.theRecentProjects(5);

      expect(builder).toBeInstanceOf(RecentProjectFakeBuilder);
      const projects = builder.buildMany(5);
      expect(projects).toHaveLength(5);
    });
  });
});
