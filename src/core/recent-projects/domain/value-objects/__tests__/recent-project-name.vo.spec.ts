import { RecentProjectName } from '../recent-project-name.vo';
import { DomainError } from '@core/shared/domain/errors';

describe('RecentProjectName Value Object', () => {
  describe('creation', () => {
    it('should create a valid name', () => {
      const name = RecentProjectName.create('Sentinel Project');

      expect(name.toString()).toBe('Sentinel Project');
    });

    it('should trim whitespace', () => {
      const name = RecentProjectName.create('  Sentinel Project  ');

      expect(name.toString()).toBe('Sentinel Project');
    });

    it('should throw DomainError for empty name', () => {
      expect(() => RecentProjectName.create('')).toThrow(DomainError);
      expect(() => RecentProjectName.create('')).toThrowError('required and must be a string');
    });

    it('should throw DomainError for whitespace-only name', () => {
      expect(() => RecentProjectName.create('   ')).toThrow(DomainError);
    });

    it('should throw DomainError for name exceeding max length', () => {
      const longName = 'a'.repeat(256);

      expect(() => RecentProjectName.create(longName)).toThrow(DomainError);
      expect(() => RecentProjectName.create(longName)).toThrowError('cannot exceed 255 characters');
    });

    it('should throw DomainError for non-string value', () => {
      expect(() => RecentProjectName.create(null as any)).toThrow(DomainError);
      expect(() => RecentProjectName.create(undefined as any)).toThrow(DomainError);
    });

    it('should throw DomainError for name with control characters', () => {
      expect(() => RecentProjectName.create('Project\x00Name')).toThrow(DomainError);
      expect(() => RecentProjectName.create('Project\x1FName')).toThrow(DomainError);
    });
  });

  describe('equals', () => {
    it('should return true for equal names (case-sensitive)', () => {
      const name1 = RecentProjectName.create('Sentinel Project');
      const name2 = RecentProjectName.create('Sentinel Project');

      expect(name1.equals(name2)).toBe(true);
    });

    it('should return false for different names', () => {
      const name1 = RecentProjectName.create('Sentinel Project');
      const name2 = RecentProjectName.create('Other Project');

      expect(name1.equals(name2)).toBe(false);
    });

    it('should return false for non-RecentProjectName', () => {
      const name = RecentProjectName.create('Sentinel Project');

      expect(name.equals({} as any)).toBe(false);
    });
  });

  describe('utility methods', () => {
    it('should check if contains substring (case-insensitive)', () => {
      const name = RecentProjectName.create('Sentinel Project Alpha');

      expect(name.contains('sentinel')).toBe(true);
      expect(name.contains('PROJECT')).toBe(true);
      expect(name.contains('alpha')).toBe(true);
      expect(name.contains('beta')).toBe(false);
    });

    it('should get length', () => {
      const name = RecentProjectName.create('Sentinel');

      expect(name.getLength()).toBe(8);
    });

    it('should get initials', () => {
      const name1 = RecentProjectName.create('Sentinel Project');
      const name2 = RecentProjectName.create('A Very Long Name Here');
      const name3 = RecentProjectName.create('Single');
      const name4 = RecentProjectName.create('Two Words');

      expect(name1.getInitials()).toBe('SP');
      expect(name2.getInitials()).toBe('AVL');
      expect(name3.getInitials()).toBe('S');
      expect(name4.getInitials()).toBe('TW');
    });
  });
});
