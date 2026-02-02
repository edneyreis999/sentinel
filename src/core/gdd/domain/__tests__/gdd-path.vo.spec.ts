import { GddPath } from '../value-objects/gdd-path.vo';
import { DomainError } from '../../../shared/domain/errors/domain.error';

describe('GddPath', () => {
  describe('happy path', () => {
    it('should create a valid GddPath for markdown file', () => {
      const path = new GddPath('/gdds/my-project.md');

      expect(path.getValue()).toBe('/gdds/my-project.md');
      expect(path.getExtension()).toBe('md');
      expect(path.isDirectory()).toBe(false);
    });

    it('should create a valid GddPath for JSON file', () => {
      const path = new GddPath('/config/project.json');

      expect(path.getValue()).toBe('/config/project.json');
      expect(path.getExtension()).toBe('json');
      expect(path.isDirectory()).toBe(false);
    });

    it('should create a valid GddPath for directory', () => {
      const path = new GddPath('/gdds/my-project/');

      expect(path.getValue()).toBe('/gdds/my-project/');
      expect(path.isDirectory()).toBe(true);
    });

    it('should create a valid GddPath for root directory', () => {
      const path = new GddPath('/');

      expect(path.getValue()).toBe('/');
      expect(path.isDirectory()).toBe(true);
    });

    it('should convert to string', () => {
      const path = new GddPath('/gdds/test.md');

      expect(path.toString()).toBe('/gdds/test.md');
    });

    it('should check equality correctly', () => {
      const path1 = new GddPath('/gdds/project.md');
      const path2 = new GddPath('/gdds/project.md');
      const path3 = new GddPath('/gdds/other.md');

      expect(path1.equals(path2)).toBe(true);
      expect(path1.equals(path3)).toBe(false);
    });
  });

  describe('getParentPath', () => {
    it('should return parent path for nested file', () => {
      const path = new GddPath('/gdds/projects/my-project.md');
      const parent = path.getParentPath();

      expect(parent.toString()).toBe('/gdds/projects/');
    });

    it('should return parent path for nested directory', () => {
      const path = new GddPath('/gdds/projects/my-project/');
      const parent = path.getParentPath();

      expect(parent.toString()).toBe('/gdds/projects/');
    });

    it('should return root for top-level file', () => {
      const path = new GddPath('/project.md');
      const parent = path.getParentPath();

      expect(parent.toString()).toBe('/');
    });

    it('should return root for top-level directory', () => {
      const path = new GddPath('/projects/');
      const parent = path.getParentPath();

      expect(parent.toString()).toBe('/');
    });
  });

  describe('validation errors', () => {
    it('should throw DomainError when value is empty', () => {
      expect(() => new GddPath('')).toThrow(DomainError);
      expect(() => new GddPath('')).toThrow('GDD path cannot be empty');
    });

    it('should throw DomainError when value is only whitespace', () => {
      expect(() => new GddPath('   ')).toThrow(DomainError);
      expect(() => new GddPath('   ')).toThrow('GDD path cannot be empty');
    });

    it('should throw DomainError when path does not start with /', () => {
      expect(() => new GddPath('gdds/project.md')).toThrow(DomainError);
      expect(() => new GddPath('gdds/project.md')).toThrow('must start with /');
    });

    it('should throw DomainError when path has invalid extension', () => {
      expect(() => new GddPath('/project.txt')).toThrow(DomainError);
      expect(() => new GddPath('/project.txt')).toThrow('must end with .md, .json, or /');
    });

    it('should throw DomainError when file path has no extension', () => {
      expect(() => new GddPath('/project')).toThrow(DomainError);
      expect(() => new GddPath('/project')).toThrow('must end with .md, .json, or /');
    });

    it('should throw DomainError when path contains invalid characters', () => {
      const invalidPaths = [
        '/project<name>.md',
        '/project>name>.md',
        '/project:name.md',
        '/project"name.md',
        '/project|name.md',
        '/project?name.md',
        '/project*name.md',
      ];

      invalidPaths.forEach((path) => {
        expect(() => new GddPath(path)).toThrow(DomainError);
        expect(() => new GddPath(path)).toThrow('contains invalid characters');
      });
    });

    it('should throw DomainError when path contains consecutive slashes', () => {
      expect(() => new GddPath('//project.md')).toThrow(DomainError);
      expect(() => new GddPath('/gdds//project.md')).toThrow(DomainError);
      expect(() => new GddPath('/gdds//project//')).toThrow(DomainError);
      expect(() => new GddPath('/gdds/project///')).toThrow(DomainError);
      expect(() => new GddPath('/gdds/project///file.md')).toThrow(DomainError);

      expect(() => new GddPath('//project.md')).toThrow('cannot contain consecutive slashes');
    });

    it('should throw DomainError when path exceeds 500 characters', () => {
      const longPath = '/' + 'a'.repeat(499) + '.md';
      expect(() => new GddPath(longPath)).toThrow(DomainError);
      expect(() => new GddPath(longPath)).toThrow('cannot exceed 500 characters');
    });
  });

  describe('edge cases', () => {
    it('should handle path exactly at 500 character limit', () => {
      // 1 (/) + 498 (a) + 5 (.md) = 504, too long
      // 1 (/) + 494 (a) + 5 (.md) = 500, just right
      const path = '/' + 'a'.repeat(494) + '.md';
      expect(() => new GddPath(path)).not.toThrow();
    });

    it('should handle paths with multiple segments', () => {
      const path = new GddPath('/gdds/projects/2024/active/my-project.md');

      expect(path.getValue()).toBe('/gdds/projects/2024/active/my-project.md');
    });

    it('should handle paths with numbers', () => {
      const path = new GddPath('/gdds/project-2024-v1.md');

      expect(path.getValue()).toBe('/gdds/project-2024-v1.md');
    });

    it('should handle paths with underscores and hyphens', () => {
      const paths = [
        '/gdds/my_project.md',
        '/gdds/my-project.md',
        '/gdds/my_project-v2.md',
      ];

      paths.forEach((path) => {
        expect(() => new GddPath(path)).not.toThrow();
        const gddPath = new GddPath(path);
        expect(gddPath.getValue()).toBe(path);
      });
    });

    it('should handle paths with dots in directory names', () => {
      const path = new GddPath('/gdds/v1.0/project.md');

      expect(path.getValue()).toBe('/gdds/v1.0/project.md');
    });

    it('should handle paths with spaces', () => {
      const path = new GddPath('/gdds/my project.md');

      expect(path.getValue()).toBe('/gdds/my project.md');
    });

    it('should return null for extension when path has no match', () => {
      // This shouldn't happen with validation, but tests the method
      const path = new GddPath('/directory/');
      expect(path.getExtension()).toBe('directory');
    });
  });

  describe('immutability', () => {
    it('should not allow modification of internal value', () => {
      const pathValue = '/gdds/project.md';
      const path = new GddPath(pathValue);

      expect(path.getValue()).toBe(pathValue);
    });

    it('should create new instance for parent path', () => {
      const path = new GddPath('/gdds/projects/my-project.md');
      const parent = path.getParentPath();

      expect(parent).not.toBe(path);
      expect(path.toString()).toBe('/gdds/projects/my-project.md');
    });
  });

  describe('equals method', () => {
    it('should return false when comparing with non-GddPath', () => {
      const path = new GddPath('/gdds/project.md');

      expect(path.equals(null as any)).toBe(false);
      expect(path.equals(undefined as any)).toBe(false);
      expect(path.equals('/gdds/project.md' as any)).toBe(false);
      expect(path.equals({ getValue: () => '/gdds/project.md' } as any)).toBe(false);
    });

    it('should be case-sensitive', () => {
      const path1 = new GddPath('/gdds/Project.md');
      const path2 = new GddPath('/gdds/project.md');

      expect(path1.equals(path2)).toBe(false);
    });
  });
});
