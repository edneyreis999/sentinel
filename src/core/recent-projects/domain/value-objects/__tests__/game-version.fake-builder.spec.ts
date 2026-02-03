import { GameVersionFakeBuilder } from '../game-version.fake-builder';
import { GameVersion } from '../game-version.vo';
import { DomainError } from '@core/shared/domain/errors';

describe('GameVersionFakeBuilder', () => {
  describe('aGameVersion()', () => {
    it('should create a builder instance', () => {
      const builder = GameVersionFakeBuilder.aGameVersion();
      expect(builder).toBeInstanceOf(GameVersionFakeBuilder);
    });

    it('should build a valid GameVersion with default semver', () => {
      const version = GameVersionFakeBuilder.aGameVersion().build();
      expect(version).toBeInstanceOf(GameVersion);
    });
  });

  describe('withValue()', () => {
    it('should override the default value with static version', () => {
      const version = GameVersionFakeBuilder.aGameVersion().withValue('2.0.0').build();

      expect(version?.toString()).toBe('2.0.0');
    });

    it('should support factory function', () => {
      const versions = GameVersionFakeBuilder.aGameVersion()
        .withValue((index) => `${index + 1}.0.0`)
        .buildMany(3);

      expect(versions[0]?.toString()).toBe('1.0.0');
      expect(versions[1]?.toString()).toBe('2.0.0');
      expect(versions[2]?.toString()).toBe('3.0.0');
    });
  });

  describe('version type helpers', () => {
    it('withSimpleVersion should create basic semver', () => {
      const version = GameVersionFakeBuilder.aGameVersion().withSimpleVersion().build();

      expect(version?.toString()).toBe('1.0.0');
    });

    it('withPrereleaseVersion should create prerelease version', () => {
      const version = GameVersionFakeBuilder.aGameVersion().withPrereleaseVersion().build();

      expect(version?.toString()).toContain('-beta');
      expect(version?.isPrerelease()).toBe(true);
    });

    it('withVPrefix should create version with v prefix', () => {
      const version = GameVersionFakeBuilder.aGameVersion().withVPrefix().build();

      expect(version?.toString()).toMatch(/^v\d+\.\d+\.\d+$/);
    });

    it('withBuildMetadata should create version with build info', () => {
      const version = GameVersionFakeBuilder.aGameVersion().withBuildMetadata().build();

      expect(version?.toString()).toContain('+build.');
    });

    it('withFullSemver should create complete semver with prerelease and build', () => {
      const version = GameVersionFakeBuilder.aGameVersion().withFullSemver().build();

      expect(version?.toString()).toContain('-alpha.');
      expect(version?.toString()).toContain('+build.');
    });
  });

  describe('buildNonNull()', () => {
    it('should return non-null GameVersion when valid', () => {
      const version = GameVersionFakeBuilder.aGameVersion().withSimpleVersion().buildNonNull();

      expect(version).toBeInstanceOf(GameVersion);
      expect(version.toString()).toBe('1.0.0');
    });

    it('should throw when value is empty', () => {
      const builder = GameVersionFakeBuilder.aGameVersion().withEmptyValue();

      expect(() => builder.buildNonNull()).toThrow();
    });
  });

  describe('buildMany()', () => {
    it('should generate multiple unique instances', () => {
      const versions = GameVersionFakeBuilder.aGameVersion().buildMany(5);

      expect(versions).toHaveLength(5);
      versions.forEach((version) => {
        if (version !== null) {
          expect(version).toBeInstanceOf(GameVersion);
        }
      });
    });
  });

  describe('invalid values for testing validation', () => {
    it('withEmptyValue should return null when built', () => {
      const version = GameVersionFakeBuilder.aGameVersion().withEmptyValue().build();

      expect(version).toBeNull();
    });

    it('withInvalidFormat should throw DomainError when built', () => {
      const builder = GameVersionFakeBuilder.aGameVersion().withInvalidFormat();

      expect(() => builder.build()).toThrow(DomainError);
    });

    it('withPartialVersion should throw DomainError when built', () => {
      const builder = GameVersionFakeBuilder.aGameVersion().withPartialVersion();

      expect(() => builder.build()).toThrow(DomainError);
    });
  });

  describe('buildValue()', () => {
    it('should return raw string value without creating VO', () => {
      const value = GameVersionFakeBuilder.aGameVersion().withEmptyValue().buildValue();

      expect(value).toBe('');
      expect(typeof value).toBe('string');
    });
  });
});
