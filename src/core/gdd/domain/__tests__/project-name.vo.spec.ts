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
    describe('empty values', () => {
      it.each([
        { input: '', description: 'empty string' },
        { input: '   ', description: 'only whitespace' },
        { input: '\t\t\t', description: 'only tabs' },
        { input: '\n\n', description: 'only newlines' },
        { input: '  \t\n  ', description: 'mixed whitespace' },
      ])('should throw DomainError when value is $description', ({ input }) => {
        expect(() => new ProjectName(input)).toThrow(DomainError);
        expect(() => new ProjectName(input)).toThrow('Project name cannot be empty');
      });
    });

    describe('length violations', () => {
      it.each([
        {
          input: 'AB',
          trimmedInput: 'AB',
          description: 'too short (2 chars)',
          expectedMessage: 'at least 3 characters long',
        },
        {
          input: 'A',
          trimmedInput: 'A',
          description: 'too short (1 char)',
          expectedMessage: 'at least 3 characters long',
        },
        {
          input: '  AB  ',
          trimmedInput: 'AB',
          description: 'too short after trim',
          expectedMessage: 'at least 3 characters long',
        },
        {
          input: 'A'.repeat(101),
          description: 'exceeds 100 characters',
          expectedMessage: 'cannot exceed 100 characters',
        },
        {
          input: '  ' + 'A'.repeat(101) + '  ',
          description: 'exceeds 100 after trim',
          expectedMessage: 'cannot exceed 100 characters',
        },
        {
          input: 'A'.repeat(200),
          description: 'way over limit',
          expectedMessage: 'cannot exceed 100 characters',
        },
      ])('should throw DomainError when $description', ({ input, expectedMessage }) => {
        expect(() => new ProjectName(input)).toThrow(DomainError);
        expect(() => new ProjectName(input)).toThrow(expectedMessage);
      });
    });
  });

  describe('edge cases', () => {
    describe('special characters', () => {
      it.each([
        'Project & Co',
        'Project: The Beginning',
        'Project - 2024',
        "Project's Name",
        'Project (Part 1)',
        'Project [Draft]',
        'Project #1',
        'Project @Work',
      ])('should handle name with special characters: %s', (name) => {
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

    describe('unicode characters', () => {
      it.each([
        { name: 'Proyecto Ñoño', description: 'Spanish' },
        { name: 'Projeto 中文', description: 'Chinese' },
        { name: 'Проект', description: 'Russian' },
        { name: 'プロジェクト', description: 'Japanese' },
        { name: 'مشروع', description: 'Arabic' },
        { name: 'פרויקט', description: 'Hebrew' },
      ])('should handle $description characters: $name', ({ name }) => {
        expect(() => new ProjectName(name)).not.toThrow();
        const projectName = new ProjectName(name);
        expect(projectName.getValue()).toBe(name);
      });
    });

    it('should handle names with emojis', () => {
      const name = new ProjectName('Project 🚀🎉');

      expect(name.getValue()).toBe('Project 🚀🎉');
    });

    describe('equality with non-ProjectName values', () => {
      it.each([
        { value: null, description: 'null' },
        { value: undefined, description: 'undefined' },
        { value: 'My Project', description: 'string' },
        { value: { getValue: () => 'My Project' }, description: 'object with getValue' },
      ])('should return false when comparing with $description', ({ value }) => {
        const name = new ProjectName('My Project');

        expect(name.equals(value as any)).toBe(false);
      });
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
