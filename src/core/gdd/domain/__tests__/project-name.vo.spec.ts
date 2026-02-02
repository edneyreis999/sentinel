import { ProjectName } from '../value-objects/project-name.vo';
import { DomainError } from '../../../shared/domain/errors/domain.error';

describe('ProjectName', () => {
  describe('happy path', () => {
    it('should create a valid ProjectName', () => {
      const name = new ProjectName('My Awesome Project');

      expect(name.getValue()).toBe('My Awesome Project');
    });

    it('should trim whitespace', () => {
      const name = new ProjectName('  My Project  ');

      expect(name.getValue()).toBe('My Project');
    });

    it('should accept names at minimum length (3 characters)', () => {
      const name = new ProjectName('ABC');

      expect(name.getValue()).toBe('ABC');
    });

    it('should accept names at maximum length (100 characters)', () => {
      const name = new ProjectName('A'.repeat(100));

      expect(name.getValue()).toHaveLength(100);
    });

    it('should convert to string', () => {
      const name = new ProjectName('Test Project');

      expect(name.toString()).toBe('Test Project');
    });

    it('should check equality with case-insensitive comparison', () => {
      const name1 = new ProjectName('My Project');
      const name2 = new ProjectName('my project');
      const name3 = new ProjectName('Different Project');

      expect(name1.equals(name2)).toBe(true);
      expect(name1.equals(name3)).toBe(false);
    });
  });

  describe('validation errors', () => {
    it('should throw DomainError when value is empty', () => {
      expect(() => new ProjectName('')).toThrow(DomainError);
      expect(() => new ProjectName('')).toThrow('Project name cannot be empty');
    });

    it('should throw DomainError when value is only whitespace', () => {
      expect(() => new ProjectName('   ')).toThrow(DomainError);
      expect(() => new ProjectName('   ')).toThrow('Project name cannot be empty');
    });

    it('should throw DomainError when value is only tabs', () => {
      expect(() => new ProjectName('\t\t\t')).toThrow(DomainError);
      expect(() => new ProjectName('\t\t\t')).toThrow('Project name cannot be empty');
    });

    it('should throw DomainError when value is only newlines', () => {
      expect(() => new ProjectName('\n\n')).toThrow(DomainError);
      expect(() => new ProjectName('\n\n')).toThrow('Project name cannot be empty');
    });

    it('should throw DomainError when trimmed length is less than 3', () => {
      expect(() => new ProjectName('AB')).toThrow(DomainError);
      expect(() => new ProjectName('AB')).toThrow('at least 3 characters long');

      expect(() => new ProjectName('  AB  ')).toThrow(DomainError);
      expect(() => new ProjectName('  AB  ')).toThrow('at least 3 characters long');
    });

    it('should throw DomainError when value exceeds 100 characters', () => {
      expect(() => new ProjectName('A'.repeat(101))).toThrow(DomainError);
      expect(() => new ProjectName('A'.repeat(101))).toThrow('cannot exceed 100 characters');
    });

    it('should throw DomainError when trimmed value exceeds 100 characters', () => {
      const longName = '  ' + 'A'.repeat(101) + '  ';
      expect(() => new ProjectName(longName)).toThrow(DomainError);
      expect(() => new ProjectName(longName)).toThrow('cannot exceed 100 characters');
    });
  });

  describe('edge cases', () => {
    it('should handle names with special characters', () => {
      const names = ['Project & Co', 'Project: The Beginning', 'Project - 2024', "Project's Name"];

      names.forEach((name) => {
        expect(() => new ProjectName(name)).not.toThrow();
        const projectName = new ProjectName(name);
        expect(projectName.getValue()).toBe(name);
      });
    });

    it('should handle names with numbers', () => {
      const name = new ProjectName('Project 2024 Edition');

      expect(name.getValue()).toBe('Project 2024 Edition');
    });

    it('should handle names with mixed case', () => {
      const name = new ProjectName('MiXeD CaSe PrOjEcT');

      expect(name.getValue()).toBe('MiXeD CaSe PrOjEcT');
    });

    it('should handle unicode characters', () => {
      const names = ['Proyecto Ñoño', 'Projeto 中文', 'Прoject', 'プロジェクト'];

      names.forEach((name) => {
        expect(() => new ProjectName(name)).not.toThrow();
        const projectName = new ProjectName(name);
        expect(projectName.getValue()).toBe(name);
      });
    });

    it('should handle names with emojis', () => {
      const name = new ProjectName('Project 🚀🎉');

      expect(name.getValue()).toBe('Project 🚀🎉');
    });

    it('should return false when comparing with non-ProjectName', () => {
      const name = new ProjectName('My Project');

      expect(name.equals(null as any)).toBe(false);
      expect(name.equals(undefined as any)).toBe(false);
      expect(name.equals('My Project' as any)).toBe(false);
      expect(name.equals({ getValue: () => 'My Project' } as any)).toBe(false);
    });
  });

  describe('business rules', () => {
    it('should preserve original casing in getValue', () => {
      const name = new ProjectName('My Camel Case Project');

      expect(name.getValue()).toBe('My Camel Case Project');
    });

    it('should be case-insensitive for equality but preserve original', () => {
      const name1 = new ProjectName('Title Case Project');
      const name2 = new ProjectName('title case project');

      expect(name1.equals(name2)).toBe(true);
      expect(name1.getValue()).toBe('Title Case Project');
      expect(name2.getValue()).toBe('title case project');
    });
  });
});
