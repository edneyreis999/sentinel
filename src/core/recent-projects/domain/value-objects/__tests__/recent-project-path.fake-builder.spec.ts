import { RecentProjectPathFakeBuilder } from '../recent-project-path.fake-builder';
import { RecentProjectPath } from '../recent-project-path.vo';
import { DomainError } from '@core/shared/domain/errors';

describe('RecentProjectPathFakeBuilder', () => {
  describe('aRecentProjectPath()', () => {
    it('should create a builder instance', () => {
      const builder = RecentProjectPathFakeBuilder.aRecentProjectPath();
      expect(builder).toBeInstanceOf(RecentProjectPathFakeBuilder);
    });

    it('should build a valid RecentProjectPath with default value', () => {
      const path = RecentProjectPathFakeBuilder.aRecentProjectPath().build();
      expect(path).toBeInstanceOf(RecentProjectPath);
    });
  });

  describe('withValue()', () => {
    it('should override the default value with static value', () => {
      const path = RecentProjectPathFakeBuilder.aRecentProjectPath()
        .withValue('/projects/my-game.sentinel')
        .build();

      expect(path.toString()).toBe('/projects/my-game.sentinel');
    });

    it('should support factory function', () => {
      const paths = RecentProjectPathFakeBuilder.aRecentProjectPath()
        .withValue((index) => `/projects/game-${index}.sentinel`)
        .buildMany(3);

      expect(paths[0].toString()).toBe('/projects/game-0.sentinel');
      expect(paths[1].toString()).toBe('/projects/game-1.sentinel');
      expect(paths[2].toString()).toBe('/projects/game-2.sentinel');
    });
  });

  describe('path type helpers', () => {
    it('withUnixPath should create Unix absolute path', () => {
      const path = RecentProjectPathFakeBuilder.aRecentProjectPath().withUnixPath().build();

      expect(path.isUnixPath()).toBe(true);
      expect(path.toString().startsWith('/home')).toBe(true);
    });

    it('withWindowsPath should create Windows absolute path', () => {
      const path = RecentProjectPathFakeBuilder.aRecentProjectPath().withWindowsPath().build();

      expect(path.isWindowsPath()).toBe(true);
      expect(path.toString().startsWith('C:')).toBe(true);
    });

    it('withRelativePath should create relative path', () => {
      const path = RecentProjectPathFakeBuilder.aRecentProjectPath().withRelativePath().build();

      expect(path.isRelativePath()).toBe(true);
      expect(path.toString().startsWith('./')).toBe(true);
    });

    it('withParentRelativePath should create parent-relative path', () => {
      const path = RecentProjectPathFakeBuilder.aRecentProjectPath()
        .withParentRelativePath()
        .build();

      expect(path.isRelativePath()).toBe(true);
      expect(path.toString().startsWith('../')).toBe(true);
    });

    it('withSentinelExtension should create .sentinel path', () => {
      const path = RecentProjectPathFakeBuilder.aRecentProjectPath()
        .withSentinelExtension()
        .build();

      expect(path.getExtension()).toBe('sentinel');
    });
  });

  describe('buildMany()', () => {
    it('should generate multiple unique instances', () => {
      const paths = RecentProjectPathFakeBuilder.aRecentProjectPath().buildMany(5);

      expect(paths).toHaveLength(5);
      paths.forEach((path) => expect(path).toBeInstanceOf(RecentProjectPath));
    });
  });

  describe('invalid values for testing validation', () => {
    it('withEmptyValue should throw DomainError when built', () => {
      const builder = RecentProjectPathFakeBuilder.aRecentProjectPath().withEmptyValue();

      expect(() => builder.build()).toThrow(DomainError);
    });

    it('withWhitespaceOnly should throw DomainError when built', () => {
      const builder = RecentProjectPathFakeBuilder.aRecentProjectPath().withWhitespaceOnly();

      expect(() => builder.build()).toThrow(DomainError);
    });

    it('withInvalidFormat should throw DomainError when built', () => {
      const builder = RecentProjectPathFakeBuilder.aRecentProjectPath().withInvalidFormat();

      expect(() => builder.build()).toThrow(DomainError);
    });
  });

  describe('buildValue()', () => {
    it('should return raw string value without creating VO', () => {
      const value = RecentProjectPathFakeBuilder.aRecentProjectPath().withEmptyValue().buildValue();

      expect(value).toBe('');
      expect(typeof value).toBe('string');
    });
  });
});
