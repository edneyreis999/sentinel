import { RecentProjectsInMemoryRepository } from '../recent-projects-in-memory.repository';
import { RecentProjectFakeBuilder } from '@core/recent-projects/domain/recent-project.fake-builder';

describe('RecentProjectsInMemoryRepository', () => {
  let repository: RecentProjectsInMemoryRepository;

  beforeEach(() => {
    repository = new RecentProjectsInMemoryRepository();
  });

  describe('insert', () => {
    it('should insert a new project', async () => {
      const project = RecentProjectFakeBuilder.aRecentProject()
        .withPath('/projects/test.sentinel')
        .build();

      await repository.insert(project);

      const found = await repository.findByPath('/projects/test.sentinel');
      expect(found).not.toBeNull();
      expect(found?.path).toBe('/projects/test.sentinel');
    });

    it('should allow inserting with same path (upsert behavior)', async () => {
      const project1 = RecentProjectFakeBuilder.aRecentProject()
        .withId('1')
        .withPath('/projects/test.sentinel')
        .withName('First')
        .build();

      const project2 = RecentProjectFakeBuilder.aRecentProject()
        .withId('2')
        .withPath('/projects/test.sentinel')
        .withName('Second')
        .build();

      await repository.insert(project1);
      await repository.insert(project2);

      const found = await repository.findByPath('/projects/test.sentinel');
      expect(found?.name).toBe('Second');
      expect(found?.id).toBe('2');
    });
  });

  describe('update', () => {
    it('should update an existing project', async () => {
      const project = RecentProjectFakeBuilder.aRecentProject()
        .withPath('/projects/test.sentinel')
        .withName('Original Name')
        .build();

      await repository.insert(project);

      const updated = project.updateMetadata({ name: 'Updated Name' });
      await repository.update(updated);

      const found = await repository.findByPath('/projects/test.sentinel');
      expect(found?.name).toBe('Updated Name');
    });

    it('should throw when updating non-existent project', async () => {
      const project = RecentProjectFakeBuilder.aRecentProject()
        .withPath('/projects/nonexistent.sentinel')
        .build();

      await expect(repository.update(project)).rejects.toThrow('not found');
    });
  });

  describe('upsert', () => {
    it('should insert when project does not exist', async () => {
      const project = RecentProjectFakeBuilder.aRecentProject()
        .withPath('/projects/new.sentinel')
        .build();

      await repository.upsert(project);

      const found = await repository.findByPath('/projects/new.sentinel');
      expect(found).not.toBeNull();
    });

    it('should update when project exists', async () => {
      const original = RecentProjectFakeBuilder.aRecentProject()
        .withPath('/projects/test.sentinel')
        .withName('Original')
        .build();

      const updated = RecentProjectFakeBuilder.aRecentProject()
        .withId(original.id)
        .withPath('/projects/test.sentinel')
        .withName('Updated')
        .build();

      await repository.upsert(original);
      await repository.upsert(updated);

      const found = await repository.findByPath('/projects/test.sentinel');
      expect(found?.name).toBe('Updated');
    });
  });

  describe('findByPath', () => {
    it('should find project by path', async () => {
      const project = RecentProjectFakeBuilder.aRecentProject()
        .withPath('/projects/test.sentinel')
        .build();

      await repository.insert(project);

      const found = await repository.findByPath('/projects/test.sentinel');
      expect(found).not.toBeNull();
      expect(found?.path).toBe('/projects/test.sentinel');
    });

    it('should return null when not found', async () => {
      const found = await repository.findByPath('/projects/nonexistent.sentinel');
      expect(found).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find project by ID', async () => {
      const project = RecentProjectFakeBuilder.aRecentProject().withId('custom-id').build();

      await repository.insert(project);

      const found = await repository.findById('custom-id');
      expect(found).not.toBeNull();
      expect(found?.id).toBe('custom-id');
    });

    it('should return null when ID not found', async () => {
      const found = await repository.findById('nonexistent-id');
      expect(found).toBeNull();
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      // Insert test data
      const projects = RecentProjectFakeBuilder.aRecentProject().buildMany(20);
      for (const project of projects) {
        await repository.insert(project);
      }
    });

    it('should return paginated results', async () => {
      const result = await repository.search({
        limit: 5,
        offset: 0,
      });

      expect(result.items).toHaveLength(5);
      expect(result.total).toBe(20);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(5);
      expect(result.lastPage).toBe(4);
    });

    it('should filter by name', async () => {
      const result = await repository.search({
        limit: 10,
        offset: 0,
        nameFilter: 'Project 1',
      });

      expect(result.items.length).toBeGreaterThan(0);
      result.items.forEach((item: any) => {
        expect(item.name.toLowerCase()).toContain('project 1');
      });
    });

    it('should filter by game version', async () => {
      const result = await repository.search({
        limit: 10,
        offset: 0,
        gameVersion: '1.0.0',
      });

      result.items.forEach((item: any) => {
        expect(item.gameVersion).toBe('1.0.0');
      });
    });

    it('should sort by lastOpenedAt descending', async () => {
      const result = await repository.search({
        limit: 20,
        offset: 0,
      });

      for (let i = 1; i < result.items.length; i++) {
        expect(result.items[i - 1].lastOpenedAt.getTime()).toBeGreaterThanOrEqual(
          result.items[i].lastOpenedAt.getTime(),
        );
      }
    });

    it('should handle offset correctly', async () => {
      const page1 = await repository.search({
        limit: 5,
        offset: 0,
      });

      const page2 = await repository.search({
        limit: 5,
        offset: 5,
      });

      expect(page1.items[0].id).not.toBe(page2.items[0].id);
    });
  });

  describe('delete', () => {
    it('should delete a project', async () => {
      const project = RecentProjectFakeBuilder.aRecentProject()
        .withPath('/projects/to-delete.sentinel')
        .build();

      await repository.insert(project);
      await repository.delete('/projects/to-delete.sentinel');

      const found = await repository.findByPath('/projects/to-delete.sentinel');
      expect(found).toBeNull();
    });

    it('should throw when deleting non-existent project', async () => {
      await expect(repository.delete('/projects/nonexistent.sentinel')).rejects.toThrow(
        'not found',
      );
    });
  });

  describe('count', () => {
    beforeEach(async () => {
      const projects = RecentProjectFakeBuilder.aRecentProject().buildMany(15);
      for (const project of projects) {
        await repository.insert(project);
      }
    });

    it('should count all projects', async () => {
      const count = await repository.count();
      expect(count).toBe(15);
    });

    it('should count with name filter', async () => {
      const count = await repository.count({
        nameFilter: 'Project 1',
      });

      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThan(15);
    });
  });

  describe('existsByPath', () => {
    it('should return true when project exists', async () => {
      const project = RecentProjectFakeBuilder.aRecentProject()
        .withPath('/projects/test.sentinel')
        .build();

      await repository.insert(project);

      const exists = await repository.existsByPath('/projects/test.sentinel');
      expect(exists).toBe(true);
    });

    it('should return false when project does not exist', async () => {
      const exists = await repository.existsByPath('/projects/nonexistent.sentinel');
      expect(exists).toBe(false);
    });
  });

  describe('reset', () => {
    it('should clear all projects', async () => {
      const projects = RecentProjectFakeBuilder.aRecentProject().buildMany(5);
      for (const project of projects) {
        await repository.insert(project);
      }

      repository.reset();

      const count = await repository.count();
      expect(count).toBe(0);
    });
  });

  describe('getAll', () => {
    it('should return all projects', async () => {
      const projects = RecentProjectFakeBuilder.aRecentProject().buildMany(5);
      for (const project of projects) {
        await repository.insert(project);
      }

      const all = repository.getAll();
      expect(all).toHaveLength(5);
    });
  });
});
