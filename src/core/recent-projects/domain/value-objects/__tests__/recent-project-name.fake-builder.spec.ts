import { RecentProjectNameFakeBuilder } from '../recent-project-name.fake-builder';
import { RecentProjectName } from '../recent-project-name.vo';
import { DomainError } from '@core/shared/domain/errors';

describe('RecentProjectNameFakeBuilder', () => {
  describe('aRecentProjectName()', () => {
    it('should create a builder instance', () => {
      const builder = RecentProjectNameFakeBuilder.aRecentProjectName();
      expect(builder).toBeInstanceOf(RecentProjectNameFakeBuilder);
    });

    it('should build a valid RecentProjectName with default value', () => {
      const name = RecentProjectNameFakeBuilder.aRecentProjectName().build();
      expect(name).toBeInstanceOf(RecentProjectName);
      expect(name.getLength()).toBeGreaterThan(0);
    });
  });

  describe('withValue()', () => {
    it('should override the default value with static value', () => {
      const name = RecentProjectNameFakeBuilder.aRecentProjectName()
        .withValue('My Custom Game')
        .build();

      expect(name.toString()).toBe('My Custom Game');
    });

    it('should support factory function', () => {
      const names = RecentProjectNameFakeBuilder.aRecentProjectName()
        .withValue((index) => `Game ${index}`)
        .buildMany(3);

      expect(names[0].toString()).toBe('Game 0');
      expect(names[1].toString()).toBe('Game 1');
      expect(names[2].toString()).toBe('Game 2');
    });
  });

  describe('length helpers', () => {
    it('withMinLength should create a name with minimum valid length', () => {
      const name = RecentProjectNameFakeBuilder.aRecentProjectName().withMinLength().build();

      expect(name.toString()).toBe('A');
      expect(name.getLength()).toBe(1);
    });

    it('withMaxLength should create a name with maximum valid length', () => {
      const name = RecentProjectNameFakeBuilder.aRecentProjectName().withMaxLength().build();

      expect(name.getLength()).toBe(255);
    });
  });

  describe('withRealisticName()', () => {
    it('should create realistic game project names', () => {
      const names = RecentProjectNameFakeBuilder.aRecentProjectName()
        .withRealisticName()
        .buildMany(3);

      names.forEach((name) => {
        expect(name).toBeInstanceOf(RecentProjectName);
        expect(name.getLength()).toBeGreaterThan(0);
      });
    });
  });

  describe('buildMany()', () => {
    it('should generate multiple unique instances', () => {
      const names = RecentProjectNameFakeBuilder.aRecentProjectName().buildMany(5);

      expect(names).toHaveLength(5);
      names.forEach((name) => expect(name).toBeInstanceOf(RecentProjectName));

      const values = names.map((n) => n.toString());
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(5);
    });
  });

  describe('invalid values for testing validation', () => {
    it('withEmptyValue should throw DomainError when built', () => {
      const builder = RecentProjectNameFakeBuilder.aRecentProjectName().withEmptyValue();

      expect(() => builder.build()).toThrow(DomainError);
    });

    it('withWhitespaceOnly should throw DomainError when built', () => {
      const builder = RecentProjectNameFakeBuilder.aRecentProjectName().withWhitespaceOnly();

      expect(() => builder.build()).toThrow(DomainError);
    });

    it('withTooLong should throw DomainError when built', () => {
      const builder = RecentProjectNameFakeBuilder.aRecentProjectName().withTooLong();

      expect(() => builder.build()).toThrow(DomainError);
    });

    it('withControlCharacters should throw DomainError when built', () => {
      const builder = RecentProjectNameFakeBuilder.aRecentProjectName().withControlCharacters();

      expect(() => builder.build()).toThrow(DomainError);
    });
  });

  describe('buildValue()', () => {
    it('should return raw string value without creating VO', () => {
      const value = RecentProjectNameFakeBuilder.aRecentProjectName().withEmptyValue().buildValue();

      expect(value).toBe('');
      expect(typeof value).toBe('string');
    });
  });
});
