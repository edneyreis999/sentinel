import { GameVersion } from '../game-version.vo';
import { DomainError } from '@core/shared/domain/errors';

describe('GameVersion Value Object', () => {
  describe('creation', () => {
    it('should create a valid semantic version', () => {
      const version = GameVersion.create('1.0.0');

      expect(version?.toString()).toBe('1.0.0');
    });

    it('should create version with v prefix', () => {
      const version = GameVersion.create('v2.1.0');

      expect(version?.toString()).toBe('v2.1.0');
    });

    it('should create version with prerelease', () => {
      const version = GameVersion.create('1.0.0-beta');

      expect(version?.toString()).toBe('1.0.0-beta');
    });

    it('should create version with build metadata', () => {
      const version = GameVersion.create('1.0.0+20130313144700');

      expect(version?.toString()).toBe('1.0.0+20130313144700');
    });

    it('should return null for empty string', () => {
      const version = GameVersion.create('');

      expect(version).toBeNull();
    });

    it('should return null for null', () => {
      const version = GameVersion.create(null);

      expect(version).toBeNull();
    });

    it('should return null for undefined', () => {
      const version = GameVersion.create(undefined as unknown as string | null);

      expect(version).toBeNull();
    });

    it('should throw DomainError for invalid format', () => {
      expect(() => GameVersion.create('invalid')).toThrow(DomainError);
      expect(() => GameVersion.create('1.0')).toThrow(DomainError);
      expect(() => GameVersion.create('1')).toThrow(DomainError);
    });
  });

  describe('comparison', () => {
    it('should compare versions correctly - major', () => {
      const v1 = GameVersion.create('2.0.0')!;
      const v2 = GameVersion.create('1.0.0')!;

      expect(v1.isGreaterThan(v2)).toBe(true);
      expect(v2.isLessThan(v1)).toBe(true);
      expect(v1.compare(v2)).toBe(1);
      expect(v2.compare(v1)).toBe(-1);
    });

    it('should compare versions correctly - minor', () => {
      const v1 = GameVersion.create('1.2.0')!;
      const v2 = GameVersion.create('1.1.0')!;

      expect(v1.isGreaterThan(v2)).toBe(true);
      expect(v2.isLessThan(v1)).toBe(true);
    });

    it('should compare versions correctly - patch', () => {
      const v1 = GameVersion.create('1.0.5')!;
      const v2 = GameVersion.create('1.0.3')!;

      expect(v1.isGreaterThan(v2)).toBe(true);
      expect(v2.isLessThan(v1)).toBe(true);
    });

    it('should consider equal versions as equal', () => {
      const v1 = GameVersion.create('1.0.0')!;
      const v2 = GameVersion.create('1.0.0')!;

      expect(v1.compare(v2)).toBe(0);
      expect(v1.equals(v2)).toBe(true);
    });

    it('should consider prerelease as less than release', () => {
      const v1 = GameVersion.create('1.0.0')!;
      const v2 = GameVersion.create('1.0.0-beta')!;

      expect(v1.isGreaterThan(v2)).toBe(true);
      expect(v2.isLessThan(v1)).toBe(true);
    });

    it('should return false when comparing with null', () => {
      const version = GameVersion.create('1.0.0')!;

      expect(version.equals(null)).toBe(false);
      expect(version.equals(null as any)).toBe(false);
    });
  });

  describe('parsing', () => {
    it('should parse version components', () => {
      const version = GameVersion.create('2.3.4-beta+build123')!;

      expect(version.getMajor()).toBe(2);
      expect(version.getMinor()).toBe(3);
      expect(version.getPatch()).toBe(4);

      const parsed = version.parse();
      expect(parsed.major).toBe(2);
      expect(parsed.minor).toBe(3);
      expect(parsed.patch).toBe(4);
      expect(parsed.prerelease).toBe('beta');
      expect(parsed.build).toBe('build123');
    });

    it('should detect prerelease versions', () => {
      const v1 = GameVersion.create('1.0.0-beta')!;
      const v2 = GameVersion.create('1.0.0')!;

      expect(v1.isPrerelease()).toBe(true);
      expect(v2.isPrerelease()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for equal versions', () => {
      const v1 = GameVersion.create('1.0.0')!;
      const v2 = GameVersion.create('1.0.0')!;

      expect(v1.equals(v2)).toBe(true);
    });

    it('should return false for different versions', () => {
      const v1 = GameVersion.create('1.0.0')!;
      const v2 = GameVersion.create('1.0.1')!;

      expect(v1.equals(v2)).toBe(false);
    });

    it('should return false for non-GameVersion', () => {
      const version = GameVersion.create('1.0.0')!;

      expect(version.equals({} as any)).toBe(false);
    });
  });
});
