import { ProjectIdFakeBuilder } from '../project-id.fake-builder';
import { ProjectId } from '../project-id.vo';
import { DomainError } from '@core/shared/domain/errors';

describe('ProjectIdFakeBuilder', () => {
  describe('aProjectId()', () => {
    it('should create a builder instance', () => {
      const builder = ProjectIdFakeBuilder.aProjectId();
      expect(builder).toBeInstanceOf(ProjectIdFakeBuilder);
    });

    it('should build a valid ProjectId with default UUID', () => {
      const id = ProjectIdFakeBuilder.aProjectId().build();
      expect(id).toBeInstanceOf(ProjectId);

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(id.getValue())).toBe(true);
    });
  });

  describe('withValue()', () => {
    it('should override the default value with static UUID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const id = ProjectIdFakeBuilder.aProjectId().withValue(uuid).build();

      expect(id.getValue()).toBe(uuid);
    });

    it('should support factory function', () => {
      const ids = ProjectIdFakeBuilder.aProjectId()
        .withValue(() => crypto.randomUUID())
        .buildMany(3);

      expect(ids).toHaveLength(3);
      const values = ids.map((id) => id.getValue());
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(3);
    });
  });

  describe('withDeterministicId()', () => {
    it('should create deterministic UUIDs based on index', () => {
      const id0 = ProjectIdFakeBuilder.aProjectId().withDeterministicId(0).build();
      const id1 = ProjectIdFakeBuilder.aProjectId().withDeterministicId(1).build();

      expect(id0.getValue()).toBe('00000000-0000-0000-0000-000000000000');
      expect(id1.getValue()).toBe('00000000-0000-0000-0000-000000000001');
    });
  });

  describe('withUppercaseUuid()', () => {
    it('should create valid uppercase UUID', () => {
      const id = ProjectIdFakeBuilder.aProjectId().withUppercaseUuid().build();

      expect(id).toBeInstanceOf(ProjectId);
      expect(id.getValue()).toMatch(/^[0-9A-F-]+$/);
    });
  });

  describe('buildMany()', () => {
    it('should generate multiple unique instances', () => {
      const ids = ProjectIdFakeBuilder.aProjectId().buildMany(5);

      expect(ids).toHaveLength(5);
      ids.forEach((id) => expect(id).toBeInstanceOf(ProjectId));

      const values = ids.map((id) => id.getValue());
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(5);
    });
  });

  describe('invalid values for testing validation', () => {
    it('withEmptyValue should throw DomainError when built', () => {
      const builder = ProjectIdFakeBuilder.aProjectId().withEmptyValue();

      expect(() => builder.build()).toThrow(DomainError);
    });

    it('withInvalidFormat should throw DomainError when built', () => {
      const builder = ProjectIdFakeBuilder.aProjectId().withInvalidFormat();

      expect(() => builder.build()).toThrow(DomainError);
    });

    it('withTooLong should throw DomainError when built', () => {
      const builder = ProjectIdFakeBuilder.aProjectId().withTooLong();

      expect(() => builder.build()).toThrow(DomainError);
    });
  });

  describe('buildValue()', () => {
    it('should return raw string value without creating VO', () => {
      const value = ProjectIdFakeBuilder.aProjectId().withEmptyValue().buildValue();

      expect(value).toBe('');
      expect(typeof value).toBe('string');
    });
  });
});
