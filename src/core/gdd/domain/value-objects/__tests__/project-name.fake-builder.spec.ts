import { ProjectNameFakeBuilder } from '../project-name.fake-builder';
import { ProjectName } from '../project-name.vo';
import { DomainError } from '@core/shared/domain/errors';

describe('ProjectNameFakeBuilder', () => {
  describe('aProjectName()', () => {
    it('should create a builder instance', () => {
      const builder = ProjectNameFakeBuilder.aProjectName();
      expect(builder).toBeInstanceOf(ProjectNameFakeBuilder);
    });

    it('should build a valid ProjectName with default value', () => {
      const name = ProjectNameFakeBuilder.aProjectName().build();
      expect(name).toBeInstanceOf(ProjectName);
      expect(name.getValue().length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('theProjectNames()', () => {
    it('should create a builder for multiple instances', () => {
      const builder = ProjectNameFakeBuilder.theProjectNames(5);
      expect(builder).toBeInstanceOf(ProjectNameFakeBuilder);
    });
  });

  describe('withValue()', () => {
    it('should override the default value with static value', () => {
      const name = ProjectNameFakeBuilder.aProjectName().withValue('Custom Name').build();

      expect(name.getValue()).toBe('Custom Name');
    });

    it('should support factory function', () => {
      const names = ProjectNameFakeBuilder.aProjectName()
        .withValue((index) => `Project ${index}`)
        .buildMany(3);

      expect(names[0].getValue()).toBe('Project 0');
      expect(names[1].getValue()).toBe('Project 1');
      expect(names[2].getValue()).toBe('Project 2');
    });
  });

  describe('withMinLength()', () => {
    it('should create a name with minimum valid length', () => {
      const name = ProjectNameFakeBuilder.aProjectName().withMinLength().build();

      expect(name.getValue()).toBe('Abc');
      expect(name.getValue().length).toBe(3);
    });
  });

  describe('withMaxLength()', () => {
    it('should create a name with maximum valid length', () => {
      const name = ProjectNameFakeBuilder.aProjectName().withMaxLength().build();

      expect(name.getValue().length).toBe(100);
    });
  });

  describe('buildValue()', () => {
    it('should return raw string value without creating VO', () => {
      const value = ProjectNameFakeBuilder.aProjectName().withEmptyValue().buildValue();

      expect(value).toBe('');
      expect(typeof value).toBe('string');
    });
  });

  describe('buildMany()', () => {
    it('should generate multiple unique instances', () => {
      const names = ProjectNameFakeBuilder.aProjectName().buildMany(5);

      expect(names).toHaveLength(5);
      names.forEach((name) => expect(name).toBeInstanceOf(ProjectName));

      const values = names.map((n) => n.getValue());
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(5);
    });
  });

  describe('invalid values for testing validation', () => {
    it('withEmptyValue should throw DomainError when built', () => {
      const builder = ProjectNameFakeBuilder.aProjectName().withEmptyValue();

      expect(() => builder.build()).toThrow(DomainError);
    });

    it('withTooShort should throw DomainError when built', () => {
      const builder = ProjectNameFakeBuilder.aProjectName().withTooShort();

      expect(() => builder.build()).toThrow(DomainError);
    });

    it('withTooLong should throw DomainError when built', () => {
      const builder = ProjectNameFakeBuilder.aProjectName().withTooLong();

      expect(() => builder.build()).toThrow(DomainError);
    });
  });
});
