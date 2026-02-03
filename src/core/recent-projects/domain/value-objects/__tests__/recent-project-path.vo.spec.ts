import { RecentProjectPath } from '../recent-project-path.vo';
import { DomainError } from '@core/shared/domain/errors';

describe('RecentProjectPath Value Object', () => {
  describe('creation', () => {
    it('should create a valid Unix absolute path', () => {
      const path = RecentProjectPath.create('/projects/sentinel.sentinel');

      expect(path.toString()).toBe('/projects/sentinel.sentinel');
    });

    it('should create a valid Windows absolute path', () => {
      const path = RecentProjectPath.create('C:\\projects\\sentinel.sentinel');

      expect(path.toString()).toBe('C:/projects/sentinel.sentinel');
    });

    it('should create a valid relative path', () => {
      const path = RecentProjectPath.create('./projects/sentinel.sentinel');

      expect(path.toString()).toBe('./projects/sentinel.sentinel');
    });

    it('should normalize path separators', () => {
      const path = RecentProjectPath.create('C:\\projects/sentinel\\file.sentinel');

      expect(path.toString()).toBe('C:/projects/sentinel/file.sentinel');
    });

    it('should trim whitespace', () => {
      const path = RecentProjectPath.create('  /projects/sentinel.sentinel  ');

      expect(path.toString()).toBe('/projects/sentinel.sentinel');
    });

    it('should throw DomainError for empty path', () => {
      expect(() => RecentProjectPath.create('')).toThrow(DomainError);
      expect(() => RecentProjectPath.create('')).toThrowError('Project path is required');
    });

    it('should throw DomainError for whitespace-only path', () => {
      expect(() => RecentProjectPath.create('   ')).toThrow(DomainError);
    });

    it('should throw DomainError for non-string value', () => {
      expect(() => RecentProjectPath.create(null as any)).toThrow(DomainError);
      expect(() => RecentProjectPath.create(undefined as any)).toThrow(DomainError);
    });
  });

  describe('equals', () => {
    it('should return true for equal paths (case-insensitive)', () => {
      const path1 = RecentProjectPath.create('/projects/Sentinel.sentinel');
      const path2 = RecentProjectPath.create('/projects/sentinel.sentinel');

      expect(path1.equals(path2)).toBe(true);
    });

    it('should return false for different paths', () => {
      const path1 = RecentProjectPath.create('/projects/sentinel1.sentinel');
      const path2 = RecentProjectPath.create('/projects/sentinel2.sentinel');

      expect(path1.equals(path2)).toBe(false);
    });

    it('should return false for non-RecentProjectPath', () => {
      const path = RecentProjectPath.create('/projects/sentinel.sentinel');

      expect(path.equals({} as any)).toBe(false);
    });
  });

  describe('path type detection', () => {
    it('should detect Windows paths', () => {
      const path = RecentProjectPath.create('C:\\projects\\sentinel.sentinel');

      expect(path.isWindowsPath()).toBe(true);
      expect(path.isUnixPath()).toBe(false);
      expect(path.isRelativePath()).toBe(false);
    });

    it('should detect Unix absolute paths', () => {
      const path = RecentProjectPath.create('/projects/sentinel.sentinel');

      expect(path.isUnixPath()).toBe(true);
      expect(path.isWindowsPath()).toBe(false);
      expect(path.isRelativePath()).toBe(false);
    });

    it('should detect relative paths', () => {
      const path1 = RecentProjectPath.create('./projects/sentinel.sentinel');
      const path2 = RecentProjectPath.create('../other/project.sentinel');

      expect(path1.isRelativePath()).toBe(true);
      expect(path2.isRelativePath()).toBe(true);
    });
  });

  describe('file operations', () => {
    it('should get file extension', () => {
      const path = RecentProjectPath.create('/projects/sentinel.sentinel');

      expect(path.getExtension()).toBe('sentinel');
    });

    it('should return null for path without extension', () => {
      const path = RecentProjectPath.create('/projects/sentinel');

      expect(path.getExtension()).toBeNull();
    });

    it('should get directory name', () => {
      const path = RecentProjectPath.create('/projects/sentinel/sentinel.sentinel');

      expect(path.getDirectoryName()).toBe('/projects/sentinel');
    });

    it('should return dot for file in root', () => {
      const path = RecentProjectPath.create('./sentinel.sentinel');

      expect(path.getDirectoryName()).toBe('.');
    });

    it('should get file name', () => {
      const path = RecentProjectPath.create('/projects/sentinel.sentinel');

      expect(path.getFileName()).toBe('sentinel.sentinel');
    });
  });
});
