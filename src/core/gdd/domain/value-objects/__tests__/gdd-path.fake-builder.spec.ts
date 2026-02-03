import { GddPathFakeBuilder } from '../gdd-path.fake-builder';
import { GddPath } from '../gdd-path.vo';
import { DomainError } from '@core/shared/domain/errors';

describe('GddPathFakeBuilder', () => {
  describe('aGddPath()', () => {
    it('should create a builder instance', () => {
      const builder = GddPathFakeBuilder.aGddPath();
      expect(builder).toBeInstanceOf(GddPathFakeBuilder);
    });

    it('should build a valid GddPath with default value', () => {
      const path = GddPathFakeBuilder.aGddPath().build();
      expect(path).toBeInstanceOf(GddPath);
      expect(path.getValue().startsWith('/')).toBe(true);
    });
  });

  describe('withValue()', () => {
    it('should override the default value with static value', () => {
      const path = GddPathFakeBuilder.aGddPath().withValue('/custom/path.md').build();

      expect(path.getValue()).toBe('/custom/path.md');
    });

    it('should support factory function', () => {
      const paths = GddPathFakeBuilder.aGddPath()
        .withValue((index) => `/path/file-${index}.md`)
        .buildMany(3);

      expect(paths[0].getValue()).toBe('/path/file-0.md');
      expect(paths[1].getValue()).toBe('/path/file-1.md');
      expect(paths[2].getValue()).toBe('/path/file-2.md');
    });
  });

  describe('path type helpers', () => {
    it('withMarkdownPath should create .md path', () => {
      const path = GddPathFakeBuilder.aGddPath().withMarkdownPath().build();

      expect(path.getValue().endsWith('.md')).toBe(true);
      expect(path.getExtension()).toBe('md');
    });

    it('withJsonPath should create .json path', () => {
      const path = GddPathFakeBuilder.aGddPath().withJsonPath().build();

      expect(path.getValue().endsWith('.json')).toBe(true);
      expect(path.getExtension()).toBe('json');
    });

    it('withDirectoryPath should create directory path', () => {
      const path = GddPathFakeBuilder.aGddPath().withDirectoryPath().build();

      expect(path.getValue().endsWith('/')).toBe(true);
      expect(path.isDirectory()).toBe(true);
    });

    it('withRootPath should create root path', () => {
      const path = GddPathFakeBuilder.aGddPath().withRootPath().build();

      expect(path.getValue()).toBe('/');
    });
  });

  describe('buildMany()', () => {
    it('should generate multiple unique instances', () => {
      const paths = GddPathFakeBuilder.aGddPath().buildMany(5);

      expect(paths).toHaveLength(5);
      paths.forEach((path) => expect(path).toBeInstanceOf(GddPath));
    });
  });

  describe('invalid values for testing validation', () => {
    it('withEmptyValue should throw DomainError when built', () => {
      const builder = GddPathFakeBuilder.aGddPath().withEmptyValue();

      expect(() => builder.build()).toThrow(DomainError);
    });

    it('withNoLeadingSlash should throw DomainError when built', () => {
      const builder = GddPathFakeBuilder.aGddPath().withNoLeadingSlash();

      expect(() => builder.build()).toThrow(DomainError);
    });

    it('withInvalidExtension should throw DomainError when built', () => {
      const builder = GddPathFakeBuilder.aGddPath().withInvalidExtension();

      expect(() => builder.build()).toThrow(DomainError);
    });

    it('withDoubleSlashes should throw DomainError when built', () => {
      const builder = GddPathFakeBuilder.aGddPath().withDoubleSlashes();

      expect(() => builder.build()).toThrow(DomainError);
    });

    it('withTooLong should throw DomainError when built', () => {
      const builder = GddPathFakeBuilder.aGddPath().withTooLong();

      expect(() => builder.build()).toThrow(DomainError);
    });
  });

  describe('buildValue()', () => {
    it('should return raw string value without creating VO', () => {
      const value = GddPathFakeBuilder.aGddPath().withEmptyValue().buildValue();

      expect(value).toBe('');
      expect(typeof value).toBe('string');
    });
  });
});
