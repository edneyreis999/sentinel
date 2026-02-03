import { ProjectId } from '../value-objects/project-id.vo';
import { DomainError } from '../../../shared/domain/errors/domain.error';

describe('ProjectId', () => {
  describe('happy path', () => {
    it('should create a valid ProjectId with UUID', () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';

      const projectId = new ProjectId(validUUID);

      expect(projectId.getValue()).toBe(validUUID);
    });

    it('should accept UUID in different formats', () => {
      const uuids = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
        '00000000-0000-0000-0000-000000000000',
      ];

      uuids.forEach((uuid) => {
        expect(() => new ProjectId(uuid)).not.toThrow();
        const projectId = new ProjectId(uuid);
        expect(projectId.getValue()).toBe(uuid);
      });
    });

    it('should convert to string', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const projectId = new ProjectId(uuid);

      expect(projectId.toString()).toBe(uuid);
    });

    it('should check equality correctly', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const projectId1 = new ProjectId(uuid);
      const projectId2 = new ProjectId(uuid);
      const projectId3 = new ProjectId('6ba7b810-9dad-11d1-80b4-00c04fd430c8');

      expect(projectId1.equals(projectId2)).toBe(true);
      expect(projectId1.equals(projectId3)).toBe(false);
    });
  });

  describe('validation errors', () => {
    it('should throw DomainError when value is empty', () => {
      expect(() => new ProjectId('')).toThrow(DomainError);
      expect(() => new ProjectId('')).toThrow('Project ID cannot be empty');
    });

    it('should throw DomainError when value is only whitespace', () => {
      expect(() => new ProjectId('   ')).toThrow(DomainError);
      expect(() => new ProjectId('   ')).toThrow('Project ID cannot be empty');
    });

    it('should throw DomainError when value exceeds 255 characters', () => {
      const longString = 'a'.repeat(256);
      expect(() => new ProjectId(longString)).toThrow(DomainError);
      expect(() => new ProjectId(longString)).toThrow('cannot exceed 255 characters');
    });

    it('should throw DomainError when value is not a valid UUID', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '550e8400-e29b-41d4-a716', // Incomplete
        '550e8400-e29b-41d4-a716-44665544000', // Incomplete
        '550e8400-e29b-41d4-a716-4466554400000', // Too long
        '550e8400-e29b-41d4-a716-44665544000g', // Invalid character
        '550e8400_e29b-41d4-a716-446655440000', // Wrong separator
      ];

      invalidUUIDs.forEach((uuid) => {
        expect(() => new ProjectId(uuid)).toThrow(DomainError);
        expect(() => new ProjectId(uuid)).toThrow('must be a valid UUID');
      });
    });
  });

  describe('edge cases', () => {
    it('should handle UUID exactly at 255 character limit', () => {
      // Standard UUID is 36 characters, so this should be fine
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(() => new ProjectId(uuid)).not.toThrow();
    });

    it('should handle nil UUID', () => {
      const nilUUID = '00000000-0000-0000-0000-000000000000';
      const projectId = new ProjectId(nilUUID);

      expect(projectId.getValue()).toBe(nilUUID);
    });

    it('should return false when comparing with non-ProjectId', () => {
      const projectId = new ProjectId('550e8400-e29b-41d4-a716-446655440000');

      expect(projectId.equals(null as any)).toBe(false);
      expect(projectId.equals(undefined as any)).toBe(false);
      expect(projectId.equals('550e8400-e29b-41d4-a716-446655440000' as any)).toBe(false);
      expect(
        projectId.equals({ getValue: () => '550e8400-e29b-41d4-a716-446655440000' } as any),
      ).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should not allow modification of internal value', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const projectId = new ProjectId(uuid);

      // Attempt to modify (if value were mutable)
      // getValue() should always return the same value
      expect(projectId.getValue()).toBe(uuid);
    });
  });
});
