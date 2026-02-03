import { validateResponse } from '../validateResponse';
import { InternalServerErrorException } from '@nestjs/common';
import { z } from 'zod';

describe('validateResponse', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('basic validation', () => {
    const schema = z.object({
      id: z.string().uuid(),
      name: z.string(),
      status: z.enum(['active', 'inactive']),
    });

    it('should validate and return parsed data when response is valid', () => {
      const data = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Entity',
        status: 'active' as const,
      };

      const result = validateResponse(schema, data);

      expect(result).toEqual(data);
    });

    it('should throw InternalServerErrorException with proper message when validation fails', () => {
      const data = {
        id: 'invalid-uuid',
        name: 'Test',
        status: 'invalid',
      };

      try {
        validateResponse(schema, data);
        fail('Should have thrown InternalServerErrorException');
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect((error as InternalServerErrorException).message).toBe('Response validation failed');
      }
    });

    it('should log error to console when validation fails', () => {
      const data = {
        id: 'not-a-uuid',
        name: 'Test',
        status: 'invalid',
      };

      try {
        validateResponse(schema, data);
        fail('Should have thrown InternalServerErrorException');
      } catch {
        // Expected to throw
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Response validation failed:',
        expect.any(Object),
      );
    });
  });

  describe('null and undefined handling', () => {
    it('should throw InternalServerErrorException when data is null', () => {
      const schema = z.object({
        id: z.string(),
      });

      expect(() => validateResponse(schema, null)).toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when data is undefined', () => {
      const schema = z.object({
        id: z.string(),
      });

      expect(() => validateResponse(schema, undefined)).toThrow(InternalServerErrorException);
    });

    it('should accept null for nullable fields', () => {
      const schema = z.object({
        id: z.string(),
        description: z.string().nullable(),
      });

      const data = {
        id: '123',
        description: null,
      };

      const result = validateResponse(schema, data);

      expect(result).toEqual(data);
    });

    it('should accept undefined for optional fields', () => {
      const schema = z.object({
        id: z.string(),
        description: z.string().optional(),
      });

      const data = {
        id: '123',
      };

      const result = validateResponse(schema, data);

      expect(result).toEqual({ id: '123', description: undefined });
    });

    it('should accept null or undefined for optional nullable fields', () => {
      const schema = z.object({
        id: z.string(),
        description: z.string().nullable().optional(),
      });

      const data1 = { id: '123', description: null };
      const data2 = { id: '123' };

      expect(validateResponse(schema, data1)).toEqual(data1);
      expect(validateResponse(schema, data2)).toEqual({ id: '123', description: undefined });
    });
  });

  describe('optional fields', () => {
    it('should validate with optional field present', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().optional(),
      });

      const data = { name: 'John', age: 25 };

      const result = validateResponse(schema, data);

      expect(result).toEqual(data);
    });

    it('should validate without optional field', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().optional(),
      });

      const data = { name: 'John' };

      const result = validateResponse(schema, data);

      expect(result).toEqual({ name: 'John', age: undefined });
    });

    it('should validate with default value when field is missing', () => {
      const schema = z.object({
        name: z.string(),
        role: z.string().default('user'),
      });

      const data = { name: 'John' };

      const result = validateResponse(schema, data);

      expect(result).toEqual({ name: 'John', role: 'user' });
    });
  });

  describe('zod transformations', () => {
    it('should apply transform to string field', () => {
      const schema = z.object({
        email: z.string().transform((val) => val.toLowerCase()),
        name: z.string(),
      });

      const data = { email: 'JOHN@EXAMPLE.COM', name: 'John' };

      const result = validateResponse(schema, data);

      expect(result).toEqual({ email: 'john@example.com', name: 'John' });
    });

    it('should apply transform to trim whitespace', () => {
      const schema = z.object({
        username: z.string().transform((val) => val.trim()),
      });

      const data = { username: '  john_doe  ' };

      const result = validateResponse(schema, data);

      expect(result).toEqual({ username: 'john_doe' });
    });

    it('should apply transform to convert string to number', () => {
      const schema = z.object({
        count: z.string().transform((val) => parseInt(val, 10)),
      });

      const data = { count: '42' };

      const result = validateResponse(schema, data);

      expect(result).toEqual({ count: 42 });
    });
  });

  describe('zod refinements', () => {
    it('should pass custom refinement when condition is met', () => {
      const schema = z.object({
        password: z.string().refine((val) => val.length >= 8, {
          message: 'Password must be at least 8 characters',
        }),
      });

      const data = { password: 'securePassword123' };

      const result = validateResponse(schema, data);

      expect(result).toEqual(data);
    });

    it('should throw InternalServerErrorException when refinement fails', () => {
      const schema = z.object({
        password: z.string().refine((val) => val.length >= 8, {
          message: 'Password must be at least 8 characters',
        }),
      });

      const data = { password: 'short' };

      expect(() => validateResponse(schema, data)).toThrow(InternalServerErrorException);
    });

    it('should pass refinement with custom logic', () => {
      const schema = z.object({
        age: z.number().refine((val) => val >= 18 && val <= 120, {
          message: 'Age must be between 18 and 120',
        }),
      });

      const data = { age: 25 };

      const result = validateResponse(schema, data);

      expect(result).toEqual(data);
    });

    it('should throw InternalServerErrorException when custom refinement fails', () => {
      const schema = z.object({
        age: z.number().refine((val) => val >= 18 && val <= 120, {
          message: 'Age must be between 18 and 120',
        }),
      });

      const data = { age: 15 };

      expect(() => validateResponse(schema, data)).toThrow(InternalServerErrorException);
    });

    it('should pass multiple refinements on same field', () => {
      const schema = z.object({
        username: z
          .string()
          .refine((val) => val.length >= 3, { message: 'Username too short' })
          .refine((val) => val.length <= 20, { message: 'Username too long' })
          .refine((val) => /^[a-zA-Z0-9_]+$/.test(val), { message: 'Invalid characters' }),
      });

      const data = { username: 'john_doe123' };

      const result = validateResponse(schema, data);

      expect(result).toEqual(data);
    });

    it('should throw InternalServerErrorException when any of multiple refinements fails', () => {
      const schema = z.object({
        username: z
          .string()
          .refine((val) => val.length >= 3, { message: 'Username too short' })
          .refine((val) => /^[a-zA-Z0-9_]+$/.test(val), { message: 'Invalid characters' }),
      });

      const data = { username: 'ab' };

      expect(() => validateResponse(schema, data)).toThrow(InternalServerErrorException);
    });
  });
});
