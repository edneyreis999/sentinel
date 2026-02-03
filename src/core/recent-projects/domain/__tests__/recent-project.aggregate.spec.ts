import { RecentProject } from '../recent-project.aggregate';
import { RecentProjectFakeBuilder } from '../recent-project.fake-builder';
import { DomainError } from '@core/shared/domain/errors';

const TIME_TOLERANCE_MS = 100;

describe('RecentProject Aggregate', () => {
  describe('creation', () => {
    it('should create a valid project with all fields', () => {
      const project = RecentProject.create({
        path: '/projects/sentinel.sentinel',
        name: 'Sentinel Project',
        gameVersion: '1.0.0',
        screenshotPath: '/screenshots/screenshot.png',
        trechoCount: 10,
      });

      expect(project.id).toBeDefined();
      expect(project.path).toBe('/projects/sentinel.sentinel');
      expect(project.name).toBe('Sentinel Project');
      expect(project.gameVersion).toBe('1.0.0');
      expect(project.screenshotPath).toBe('/screenshots/screenshot.png');
      expect(project.trechoCount).toBe(10);
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
      expect(project.lastOpenedAt).toBeInstanceOf(Date);
    });

    it('should create a project with only required fields', () => {
      const project = RecentProject.create({
        path: '/projects/sentinel.sentinel',
        name: 'Sentinel Project',
      });

      expect(project.path).toBe('/projects/sentinel.sentinel');
      expect(project.name).toBe('Sentinel Project');
      expect(project.gameVersion).toBeNull();
      expect(project.screenshotPath).toBeNull();
      expect(project.trechoCount).toBeNull();
    });

    it('should throw DomainError for negative trecho count', () => {
      expect(() =>
        RecentProject.create({
          path: '/projects/sentinel.sentinel',
          name: 'Sentinel Project',
          trechoCount: -1,
        }),
      ).toThrow(DomainError);
    });

    it('should throw DomainError for invalid path', () => {
      expect(() =>
        RecentProject.create({
          path: '',
          name: 'Sentinel Project',
        }),
      ).toThrow(DomainError);
    });

    it('should throw DomainError for invalid name', () => {
      expect(() =>
        RecentProject.create({
          path: '/projects/sentinel.sentinel',
          name: '',
        }),
      ).toThrow(DomainError);
    });

    it('should throw DomainError for invalid game version format', () => {
      expect(() =>
        RecentProject.create({
          path: '/projects/sentinel.sentinel',
          name: 'Sentinel Project',
          gameVersion: 'invalid',
        }),
      ).toThrow(DomainError);
    });
  });

  describe('reconstitution from persistence', () => {
    it('should reconstitute from persistence data', () => {
      const props = {
        id: '123',
        path: '/projects/sentinel.sentinel',
        name: 'Sentinel Project',
        gameVersion: '1.0.0',
        screenshotPath: '/screenshots/screenshot.png',
        trechoCount: 10,
        lastOpenedAt: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const project = RecentProject.fromPersistence(props);

      expect(project.id).toBe('123');
      expect(project.path).toBe('/projects/sentinel.sentinel');
      expect(project.name).toBe('Sentinel Project');
    });
  });

  describe('business methods', () => {
    it('should update last opened timestamp', () => {
      const project = RecentProjectFakeBuilder.aRecentProject()
        .withLastOpenedAt(new Date('2024-01-01'))
        .build();

      const beforeUpdate = Date.now();
      const updated = project.updateLastOpened();
      const afterUpdate = Date.now();

      expect(updated.lastOpenedAt.getTime()).toBeGreaterThan(project.lastOpenedAt.getTime());
      expect(updated.lastOpenedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate - TIME_TOLERANCE_MS,
      );
      expect(updated.lastOpenedAt.getTime()).toBeLessThanOrEqual(afterUpdate + TIME_TOLERANCE_MS);
      expect(updated.path).toBe(project.path);
      expect(updated.name).toBe(project.name);
    });

    it('should update metadata', () => {
      const project = RecentProjectFakeBuilder.aRecentProject().build();

      const beforeUpdate = Date.now();
      const updated = project.updateMetadata({
        name: 'Updated Name',
        gameVersion: '2.0.0',
      });
      const afterUpdate = Date.now();

      expect(updated.name).toBe('Updated Name');
      expect(updated.gameVersion).toBe('2.0.0');
      expect(updated.path).toBe(project.path);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate - TIME_TOLERANCE_MS);
      expect(updated.updatedAt.getTime()).toBeLessThanOrEqual(afterUpdate + TIME_TOLERANCE_MS);
    });

    it('should update trecho count', () => {
      const project = RecentProjectFakeBuilder.aRecentProject().withTrechoCount(10).build();

      const updated = project.updateTrechoCount(20);

      expect(updated.trechoCount).toBe(20);
      expect(updated.path).toBe(project.path);
    });

    it('should throw DomainError for negative trecho count in update', () => {
      const project = RecentProjectFakeBuilder.aRecentProject().build();

      expect(() => project.updateTrechoCount(-1)).toThrow(DomainError);
    });

    it('should check if opened within days', () => {
      const recentProject = RecentProjectFakeBuilder.aRecentProject()
        .withLastOpenedAt(new Date())
        .build();

      const oldProject = RecentProjectFakeBuilder.aRecentProject()
        .withLastOpenedAt(new Date('2024-01-01'))
        .build();

      expect(recentProject.wasOpenedWithinDays(7)).toBe(true);
      expect(oldProject.wasOpenedWithinDays(7)).toBe(false);
    });

    it('should check if has screenshot', () => {
      const withScreenshot = RecentProjectFakeBuilder.aRecentProject()
        .withScreenshotPath('/screenshot.png')
        .build();

      const withoutScreenshot = RecentProjectFakeBuilder.aRecentProject()
        .withScreenshotPath(null)
        .build();

      expect(withScreenshot.hasScreenshot()).toBe(true);
      expect(withoutScreenshot.hasScreenshot()).toBe(false);
    });

    it('should check if has trecho data', () => {
      const withData = RecentProjectFakeBuilder.aRecentProject().withTrechoCount(10).build();

      const withoutData = RecentProjectFakeBuilder.aRecentProject().withTrechoCount(null).build();

      const withZero = RecentProjectFakeBuilder.aRecentProject().withTrechoCount(0).build();

      expect(withData.hasTrechoData()).toBe(true);
      expect(withoutData.hasTrechoData()).toBe(false);
      expect(withZero.hasTrechoData()).toBe(false);
    });

    it('should compare projects by last opened date', () => {
      const newer = RecentProjectFakeBuilder.aRecentProject()
        .withLastOpenedAt(new Date('2024-01-02'))
        .build();

      const older = RecentProjectFakeBuilder.aRecentProject()
        .withLastOpenedAt(new Date('2024-01-01'))
        .build();

      expect(newer.isNewerThan(older)).toBe(true);
      expect(older.isNewerThan(newer)).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for projects with same ID', () => {
      const project1 = RecentProjectFakeBuilder.aRecentProject().withId('123').build();

      const project2 = RecentProjectFakeBuilder.aRecentProject()
        .withId('123')
        .withName('Different Name')
        .build();

      expect(project1.equals(project2)).toBe(true);
    });

    it('should return false for projects with different IDs', () => {
      const project1 = RecentProjectFakeBuilder.aRecentProject().withId('123').build();

      const project2 = RecentProjectFakeBuilder.aRecentProject().withId('456').build();

      expect(project1.equals(project2)).toBe(false);
    });

    it('should return false for non-RecentProject', () => {
      const project = RecentProjectFakeBuilder.aRecentProject().build();

      expect(project.equals({} as any)).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should convert to JSON with ISO dates', () => {
      const project = RecentProjectFakeBuilder.aRecentProject().build();

      const json = project.toJSON();

      expect(json.id).toBe(project.id);
      expect(json.path).toBe(project.path);
      expect(json.name).toBe(project.name);
      expect(json.lastOpenedAt).toBe(project.lastOpenedAt.toISOString());
      expect(json.createdAt).toBe(project.createdAt.toISOString());
      expect(json.updatedAt).toBe(project.updatedAt.toISOString());
    });
  });

  describe('toPersistence', () => {
    it('should convert to persistence format', () => {
      const project = RecentProjectFakeBuilder.aRecentProject().build();

      const persistence = project.toPersistence();

      expect(persistence.id).toBe(project.id);
      expect(persistence.path).toBe(project.path);
      expect(persistence.name).toBe(project.name);
      expect(persistence.lastOpenedAt).toEqual(project.lastOpenedAt);
      expect(persistence.createdAt).toEqual(project.createdAt);
      expect(persistence.updatedAt).toEqual(project.updatedAt);
    });
  });
});
