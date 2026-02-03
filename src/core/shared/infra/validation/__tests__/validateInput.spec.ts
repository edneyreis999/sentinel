import { validateInput } from '../validateInput';
import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

// Reusable schema for validation tests
const VALIDATION_SCHEMA = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  age: z.number().min(18).optional(),
});

// Schema with nested fields for deep validation tests
const NESTED_SCHEMA = z.object({
  user: z.object({
    profile: z.object({
      name: z.string().min(3),
      bio: z.string().optional(),
    }),
    contacts: z.array(
      z.object({
        type: z.enum(['email', 'phone']),
        value: z.string(),
      }),
    ),
  }),
});

describe('validateInput', () => {
  describe('happy path', () => {
    it('should validate and return parsed data when input is valid', () => {
      const input = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
      };

      const result = validateInput(VALIDATION_SCHEMA, input, 'body');

      expect(result).toEqual(input);
    });

    it('should validate and return parsed data without optional fields', () => {
      const input = {
        name: 'Jane Doe',
        email: 'jane@example.com',
      };

      const result = validateInput(VALIDATION_SCHEMA, input, 'body');

      expect(result).toEqual(input);
    });
  });

  describe('null and undefined handling', () => {
    it('should throw BadRequestException when required field is null', () => {
      const input = {
        name: null,
        email: 'john@example.com',
      };

      expect(() => validateInput(VALIDATION_SCHEMA, input, 'body')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException when required field is undefined', () => {
      const input = {
        email: 'john@example.com',
      };

      expect(() => validateInput(VALIDATION_SCHEMA, input, 'body')).toThrow(BadRequestException);
    });

    it('should accept null for optional fields when explicitly allowed', () => {
      const schemaWithNullable = z.object({
        name: z.string().min(3),
        email: z.string().email(),
        age: z.number().min(18).optional().nullable(),
      });

      const input = {
        name: 'John Doe',
        email: 'john@example.com',
        age: null,
      };

      const result = validateInput(schemaWithNullable, input, 'body');

      expect(result.age).toBeNull();
    });

    it.each([
      { field: 'name', value: '', description: 'empty string', schemaOverride: undefined },
      {
        field: 'email',
        value: '',
        description: 'empty string for email',
        schemaOverride: undefined,
      },
      {
        field: 'name',
        value: 'ab',
        description: 'too short (under min 3)',
        schemaOverride: undefined,
      },
      {
        field: 'email',
        value: 'not-email',
        description: 'invalid email format',
        schemaOverride: undefined,
      },
    ])(
      'should throw BadRequestException when $field is $description',
      ({ field, value, schemaOverride: _schemaOverride }) => {
        const input = {
          name: field === 'name' ? value : 'John Doe',
          email: field === 'email' ? value : 'john@example.com',
        };

        expect(() => validateInput(VALIDATION_SCHEMA, input, 'body')).toThrow(BadRequestException);
      },
    );

    it('should throw BadRequestException when name is whitespace only (with custom schema)', () => {
      const trimmedSchema = z.object({
        name: z
          .string()
          .min(1)
          .refine((val) => val.trim().length >= 3, {
            message: 'Name must be at least 3 non-whitespace characters',
          }),
        email: z.string().email(),
        age: z.number().min(18).optional(),
      });

      const input = {
        name: '   ',
        email: 'john@example.com',
      };

      expect(() => validateInput(trimmedSchema, input, 'body')).toThrow(BadRequestException);
    });
  });

  describe('validation errors', () => {
    it('should throw BadRequestException when validation fails', () => {
      const input = {
        name: 'Jo', // Too short
        email: 'invalid-email', // Invalid format
      };

      expect(() => validateInput(VALIDATION_SCHEMA, input, 'body')).toThrow(BadRequestException);
    });

    it('should include all validation errors for multiple invalid fields', () => {
      const input = {
        name: 'Jo', // Too short
        email: 'not-an-email', // Invalid format
        age: 15, // Under minimum
      };

      expect(() => validateInput(VALIDATION_SCHEMA, input, 'body')).toThrow(BadRequestException);

      try {
        validateInput(VALIDATION_SCHEMA, input, 'body');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse() as {
          message: Array<{ field: string; message: string; source: string }>;
        };
        // Should have 3 errors: name, email, age
        expect(response.message).toHaveLength(3);
        expect(response.message.map((err) => err.field)).toEqual(
          expect.arrayContaining(['name', 'email', 'age']),
        );
      }
    });

    it('should throw BadRequestException for type mismatch', () => {
      const input = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 'twenty-five', // Should be number
      };

      expect(() => validateInput(VALIDATION_SCHEMA, input, 'body')).toThrow(BadRequestException);
    });
  });

  describe('source handling', () => {
    it('should include "body" as source when validating body', () => {
      const input = {
        name: 'Jo',
        email: 'invalid-email',
      };

      expect(() => validateInput(VALIDATION_SCHEMA, input, 'body')).toThrow(BadRequestException);

      try {
        validateInput(VALIDATION_SCHEMA, input, 'body');
      } catch (error) {
        const response = (error as BadRequestException).getResponse() as {
          message: Array<{ field: string; message: string; source: string }>;
        };
        expect(response.message[0].source).toBe('body');
      }
    });

    it('should include "query" as source when validating query', () => {
      const input = {
        name: 'Jo',
        email: 'invalid-email',
      };

      expect(() => validateInput(VALIDATION_SCHEMA, input, 'query')).toThrow(BadRequestException);

      try {
        validateInput(VALIDATION_SCHEMA, input, 'query');
      } catch (error) {
        const response = (error as BadRequestException).getResponse() as {
          message: Array<{ field: string; message: string; source: string }>;
        };
        expect(response.message[0].source).toBe('query');
      }
    });

    it('should include "params" as source when validating params', () => {
      const paramsSchema = z.object({
        id: z.string().uuid(),
      });

      const input = {
        id: 'not-a-uuid',
      };

      expect(() => validateInput(paramsSchema, input, 'params')).toThrow(BadRequestException);

      try {
        validateInput(paramsSchema, input, 'params');
      } catch (error) {
        const response = (error as BadRequestException).getResponse() as {
          message: Array<{ field: string; message: string; source: string }>;
        };
        expect(response.message[0].source).toBe('params');
        expect(response.message[0].field).toBe('id');
      }
    });
  });

  describe('nested fields', () => {
    it('should handle nested field paths in error messages', () => {
      const input = {
        user: {
          profile: {
            name: 'Jo',
          },
        },
      };

      expect(() => validateInput(NESTED_SCHEMA, input, 'body')).toThrow(BadRequestException);

      try {
        validateInput(NESTED_SCHEMA, input, 'body');
      } catch (error) {
        const response = (error as BadRequestException).getResponse() as {
          message: Array<{ field: string; message: string; source: string }>;
        };
        expect(response.message[0].field).toBe('user.profile.name');
      }
    });

    it('should handle deeply nested field paths', () => {
      const deepNestedSchema = z.object({
        level1: z.object({
          level2: z.object({
            level3: z.object({
              value: z.string().min(10),
            }),
          }),
        }),
      });

      const input = {
        level1: {
          level2: {
            level3: {
              value: 'short',
            },
          },
        },
      };

      expect(() => validateInput(deepNestedSchema, input, 'body')).toThrow(BadRequestException);

      try {
        validateInput(deepNestedSchema, input, 'body');
      } catch (error) {
        const response = (error as BadRequestException).getResponse() as {
          message: Array<{ field: string; message: string; source: string }>;
        };
        expect(response.message[0].field).toBe('level1.level2.level3.value');
      }
    });
  });

  describe('arrays', () => {
    it('should validate array fields correctly', () => {
      const arraySchema = z.object({
        tags: z.array(z.string().min(2)),
      });

      const input = {
        tags: ['a', 'b', 'c'], // All too short
      };

      expect(() => validateInput(arraySchema, input, 'body')).toThrow(BadRequestException);

      try {
        validateInput(arraySchema, input, 'body');
      } catch (error) {
        const response = (error as BadRequestException).getResponse() as {
          message: Array<{ field: string; message: string; source: string }>;
        };
        expect(response.message[0].field).toBe('tags.0');
        expect(response.message[1].field).toBe('tags.1');
        expect(response.message[2].field).toBe('tags.2');
      }
    });

    it('should validate array of objects correctly', () => {
      const arrayWithRequiredSchema = z.object({
        items: z.array(
          z.object({
            name: z.string().min(3),
            value: z.string().min(1),
          }),
        ),
      });

      const input = {
        items: [
          { name: 'Valid Item', value: 'valid-value' },
          { name: 'Good Name', value: '' }, // value too short (empty string)
        ],
      };

      expect(() => validateInput(arrayWithRequiredSchema, input, 'body')).toThrow(
        BadRequestException,
      );

      try {
        validateInput(arrayWithRequiredSchema, input, 'body');
      } catch (error) {
        const response = (error as BadRequestException).getResponse() as {
          message: Array<{ field: string; message: string; source: string }>;
        };
        // Should contain error for items.1.value
        expect(response.message.some((err) => err.field === 'items.1.value')).toBe(true);
      }
    });

    it('should accept valid arrays', () => {
      const input = {
        user: {
          profile: {
            name: 'John Doe',
          },
          contacts: [
            { type: 'email', value: 'john@example.com' },
            { type: 'phone', value: '+1234567890' },
          ],
        },
      };

      const result = validateInput(NESTED_SCHEMA, input, 'body');

      expect(result).toEqual(input);
    });
  });

  describe('error details structure', () => {
    it('should include error details with field, message and source', () => {
      const input = {
        name: 'Jo',
        email: 'invalid-email',
      };

      expect(() => validateInput(VALIDATION_SCHEMA, input, 'query')).toThrow(BadRequestException);

      try {
        validateInput(VALIDATION_SCHEMA, input, 'query');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse() as {
          message: Array<{ field: string; message: string; source: string }>;
        };
        expect(response.message).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: expect.any(String),
              message: expect.any(String),
              source: 'query',
            }),
          ]),
        );
      }
    });

    it('should provide meaningful error messages', () => {
      const input = {
        name: 'Jo',
      };

      expect(() => validateInput(VALIDATION_SCHEMA, input, 'body')).toThrow(BadRequestException);

      try {
        validateInput(VALIDATION_SCHEMA, input, 'body');
      } catch (error) {
        const response = (error as BadRequestException).getResponse() as {
          message: Array<{ field: string; message: string; source: string }>;
        };
        // Check that error messages are not empty and contain useful information
        response.message.forEach((error) => {
          expect(error.message).toBeTruthy();
          expect(error.message.length).toBeGreaterThan(0);
        });
      }
    });
  });
});
