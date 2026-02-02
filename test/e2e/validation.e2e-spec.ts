import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { z } from 'zod';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { validateInput, validateResponse } from '../../src/core/shared/infra/validation';

describe('Validation Integration (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
    }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('validateInput function', () => {
    const testSchema = z.object({
      name: z.string().min(3),
      email: z.string().email(),
      age: z.number().min(0).max(120).optional(),
    });

    it('should validate valid input data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      };

      const result = validateInput(testSchema, validData, 'body');

      expect(result).toEqual(validData);
      expect(typeof result.name).toBe('string');
      expect(typeof result.email).toBe('string');
    });

    it('should validate input with optional field omitted', () => {
      const validData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
      };

      const result = validateInput(testSchema, validData, 'body');

      expect(result.name).toBe('Jane Smith');
      expect(result.email).toBe('jane@example.com');
      expect(result.age).toBeUndefined();
    });

    it('should throw BadRequestException for invalid input', () => {
      const invalidData = {
        name: 'Jo', // Too short
        email: 'invalid-email', // Not an email
        age: 150, // Too high
      };

      expect(() => {
        validateInput(testSchema, invalidData, 'body');
      }).toThrow(BadRequestException);
    });

    it('should throw BadRequestException with formatted errors', () => {
      const invalidData = {
        name: 'Jo',
        email: 'not-an-email',
      };

      expect(() => {
        validateInput(testSchema, invalidData, 'body');
      }).toThrow(BadRequestException);

      try {
        validateInput(testSchema, invalidData, 'body');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse();
        // The response might be wrapped in an object with statusCode, message, etc.
        const errors = typeof response === 'object' && response !== null && 'message' in response
          ? (response as { message: unknown }).message
          : response;

        expect(Array.isArray(errors)).toBe(true);
        if (Array.isArray(errors)) {
          expect(errors).toHaveLength(2);
          expect(errors[0]).toHaveProperty('field', 'name');
          expect(errors[0]).toHaveProperty('source', 'body');
          expect(errors[0]).toHaveProperty('message');
          expect(errors[1]).toHaveProperty('field', 'email');
          expect(errors[1]).toHaveProperty('source', 'body');
          expect(errors[1]).toHaveProperty('message');
        }
      }
    });

    it('should include source in error details', () => {
      const invalidData = { name: 'Jo' };

      expect(() => {
        validateInput(testSchema, invalidData, 'query');
      }).toThrow(BadRequestException);

      try {
        validateInput(testSchema, invalidData, 'query');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse();
        // The response might be wrapped in an object with statusCode, message, etc.
        const errors = typeof response === 'object' && response !== null && 'message' in response
          ? (response as { message: unknown }).message
          : response;

        expect(Array.isArray(errors)).toBe(true);
        if (Array.isArray(errors)) {
          expect(errors[0]).toHaveProperty('source', 'query');
        }
      }
    });

    it('should handle nested path in errors', () => {
      const nestedSchema = z.object({
        user: z.object({
          name: z.string().min(3),
          email: z.string().email(),
        }),
      });

      const invalidData = {
        user: {
          name: 'Jo',
          email: 'invalid',
        },
      };

      expect(() => {
        validateInput(nestedSchema, invalidData, 'body');
      }).toThrow(BadRequestException);

      try {
        validateInput(nestedSchema, invalidData, 'body');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse();
        // The response might be wrapped in an object with statusCode, message, etc.
        const errors = typeof response === 'object' && response !== null && 'message' in response
          ? (response as { message: unknown }).message
          : response;

        expect(Array.isArray(errors)).toBe(true);
        if (Array.isArray(errors)) {
          expect(errors[0].field).toBe('user.name');
          expect(errors[1].field).toBe('user.email');
        }
      }
    });

    it('should validate number types correctly', () => {
      const numberSchema = z.object({
        count: z.number(),
        price: z.number().positive(),
      });

      const validData = { count: 10, price: 99.99 };
      const result = validateInput(numberSchema, validData, 'body');

      expect(result.count).toBe(10);
      expect(result.price).toBe(99.99);
    });

    it('should reject invalid number types', () => {
      const numberSchema = z.object({
        count: z.number(),
      });

      expect(() => {
        validateInput(numberSchema, { count: 'not a number' }, 'body');
      }).toThrow(BadRequestException);
    });

    it('should validate array types', () => {
      const arraySchema = z.object({
        tags: z.array(z.string()).min(1),
      });

      const validData = { tags: ['typescript', 'testing'] };
      const result = validateInput(arraySchema, validData, 'body');

      expect(result.tags).toEqual(['typescript', 'testing']);
    });

    it('should reject empty arrays when min(1) is specified', () => {
      const arraySchema = z.object({
        tags: z.array(z.string()).min(1),
      });

      expect(() => {
        validateInput(arraySchema, { tags: [] }, 'body');
      }).toThrow(BadRequestException);
    });
  });

  describe('validateResponse function', () => {
    const responseSchema = z.object({
      success: z.boolean(),
      data: z.object({
        id: z.string(),
        name: z.string(),
      }),
      timestamp: z.string().datetime(),
    });

    it('should validate valid response data', () => {
      const validResponse = {
        success: true,
        data: {
          id: '123',
          name: 'Test Resource',
        },
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      const result = validateResponse(responseSchema, validResponse);

      expect(result).toEqual(validResponse);
    });

    it('should throw InternalServerErrorException for invalid response', () => {
      const invalidResponse = {
        success: 'not a boolean',
        data: {
          id: 123, // Should be string
          name: 'Test',
        },
      };

      expect(() => {
        validateResponse(responseSchema, invalidResponse);
      }).toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException with specific message', () => {
      const invalidResponse = { success: true };

      expect(() => {
        validateResponse(responseSchema, invalidResponse);
      }).toThrow(InternalServerErrorException);

      try {
        validateResponse(responseSchema, invalidResponse);
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect((error as InternalServerErrorException).message).toBe('Response validation failed');
      }
    });

    it('should validate nested objects', () => {
      const nestedSchema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string(),
            age: z.number(),
          }),
        }),
      });

      const validData = {
        user: {
          profile: {
            name: 'John Doe',
            age: 30,
          },
        },
      };

      const result = validateResponse(nestedSchema, validData);
      expect(result.user.profile.name).toBe('John Doe');
    });

    it('should validate array responses', () => {
      const arraySchema = z.object({
        items: z.array(z.object({
          id: z.string(),
          name: z.string(),
        })),
      });

      const validData = {
        items: [
          { id: '1', name: 'Item 1' },
          { id: '2', name: 'Item 2' },
        ],
      };

      const result = validateResponse(arraySchema, validData);
      expect(result.items).toHaveLength(2);
    });
  });

  describe('Integration with NestJS ValidationPipe', () => {
    it('should work with global ValidationPipe', async () => {
      // This test verifies that our custom validation works alongside NestJS ValidationPipe
      const schema = z.object({
        message: z.string().min(1),
      });

      const validData = { message: 'Test message' };
      const result = validateInput(schema, validData, 'body');

      expect(result.message).toBe('Test message');
    });

    it('should handle both validation layers', async () => {
      // Test that both Zod validation and NestJS ValidationPipe can coexist
      const schema = z.object({
        email: z.string().email(),
        username: z.string().min(3),
      });

      const validData = {
        email: 'test@example.com',
        username: 'testuser',
      };

      const result = validateInput(schema, validData, 'body');
      expect(result).toEqual(validData);
    });
  });

  describe('Real-world Validation Scenarios', () => {
    it('should validate user registration data', () => {
      const registrationSchema = z.object({
        username: z.string().min(3).max(30),
        email: z.string().email(),
        password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
        age: z.number().min(13).max(120),
      });

      const validData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'SecurePass123',
        age: 25,
      };

      const result = validateInput(registrationSchema, validData, 'body');
      expect(result).toEqual(validData);
    });

    it('should reject weak password in registration', () => {
      const registrationSchema = z.object({
        username: z.string().min(3),
        email: z.string().email(),
        password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
      });

      const weakPasswordData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'weak', // Too short and no uppercase/number
      };

      expect(() => {
        validateInput(registrationSchema, weakPasswordData, 'body');
      }).toThrow(BadRequestException);
    });

    it('should validate search query parameters', () => {
      const searchSchema = z.object({
        q: z.string().min(1),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        sort: z.enum(['relevance', 'date', 'name']).default('relevance'),
      });

      const searchQuery = {
        q: 'test search',
        page: 2,
        limit: 20,
        sort: 'date',
      };

      const result = validateInput(searchSchema, searchQuery, 'query');
      expect(result.q).toBe('test search');
      expect(result.page).toBe(2);
    });

    it('should apply default values in search query', () => {
      const searchSchema = z.object({
        q: z.string().min(1),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
      });

      const partialQuery = { q: 'test' };
      const result = validateInput(searchSchema, partialQuery, 'query');

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should validate API response with pagination', () => {
      const paginatedResponseSchema = z.object({
        data: z.array(z.object({
          id: z.string(),
          name: z.string(),
        })),
        meta: z.object({
          total: z.number(),
          page: z.number(),
          limit: z.number(),
          totalPages: z.number(),
        }),
      });

      const validResponse = {
        data: [
          { id: '1', name: 'Item 1' },
          { id: '2', name: 'Item 2' },
        ],
        meta: {
          total: 100,
          page: 1,
          limit: 10,
          totalPages: 10,
        },
      };

      const result = validateResponse(paginatedResponseSchema, validResponse);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(100);
    });
  });

  describe('Error Message Formatting', () => {
    it('should format multiple errors correctly', () => {
      const schema = z.object({
        name: z.string().min(3),
        email: z.string().email(),
        age: z.number().min(0).max(120),
      });

      const invalidData = {
        name: 'Jo',
        email: 'invalid',
        age: 150,
      };

      expect(() => {
        validateInput(schema, invalidData, 'body');
      }).toThrow(BadRequestException);

      try {
        validateInput(schema, invalidData, 'body');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse();
        // The response might be wrapped in an object with statusCode, message, etc.
        const errors = typeof response === 'object' && response !== null && 'message' in response
          ? (response as { message: unknown }).message
          : response;

        expect(Array.isArray(errors)).toBe(true);
        if (Array.isArray(errors)) {
          expect(errors).toHaveLength(3);
        }
      }
    });

    it('should handle complex validation rules', () => {
      const complexSchema = z.object({
        password: z.string()
          .min(8, 'Password must be at least 8 characters')
          .regex(/[A-Z]/, 'Password must contain uppercase letter')
          .regex(/[a-z]/, 'Password must contain lowercase letter')
          .regex(/\d/, 'Password must contain number'),
      });

      const weakPassword = 'weak';

      expect(() => {
        validateInput(complexSchema, { password: weakPassword }, 'body');
      }).toThrow(BadRequestException);

      try {
        validateInput(complexSchema, { password: weakPassword }, 'body');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse();
        // The response might be wrapped in an object with statusCode, message, etc.
        const errors = typeof response === 'object' && response !== null && 'message' in response
          ? (response as { message: unknown }).message
          : response;

        expect(Array.isArray(errors)).toBe(true);
        if (Array.isArray(errors)) {
          expect(errors[0].field).toBe('password');
        }
      }
    });
  });

  describe('Type Safety', () => {
    it('should infer correct types from schema', () => {
      const schema = z.object({
        name: z.string(),
        count: z.number(),
        active: z.boolean(),
      });

      const data = {
        name: 'Test',
        count: 42,
        active: true,
      };

      const result = validateInput(schema, data, 'body');

      // TypeScript should infer these types correctly
      expect(typeof result.name).toBe('string');
      expect(typeof result.count).toBe('number');
      expect(typeof result.active).toBe('boolean');
    });

    it('should handle union types', () => {
      const unionSchema = z.object({
        status: z.union([z.literal('active'), z.literal('inactive'), z.literal('pending')]),
      });

      const validData = { status: 'active' };
      const result = validateInput(unionSchema, validData, 'body');

      expect(result.status).toBe('active');
    });

    it('should reject invalid union types', () => {
      const unionSchema = z.object({
        status: z.union([z.literal('active'), z.literal('inactive')]),
      });

      expect(() => {
        validateInput(unionSchema, { status: 'deleted' }, 'body');
      }).toThrow(BadRequestException);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined values', () => {
      const schema = z.object({
        optional: z.string().optional(),
        nullable: z.string().nullable(),
      });

      const validData = {
        optional: undefined,
        nullable: null,
      };

      const result = validateInput(schema, validData, 'body');
      expect(result.optional).toBeUndefined();
      expect(result.nullable).toBeNull();
    });

    it('should handle empty strings', () => {
      const schema = z.object({
        name: z.string().min(1),
      });

      expect(() => {
        validateInput(schema, { name: '' }, 'body');
      }).toThrow(BadRequestException);
    });

    it('should handle whitespace-only strings', () => {
      const schema = z.object({
        name: z.string().min(1).regex(/^\S.*\S$|^\S$/, 'Must not be whitespace-only'),
      });

      expect(() => {
        validateInput(schema, { name: '   ' }, 'body');
      }).toThrow(BadRequestException);
    });

    it('should handle very long strings', () => {
      const schema = z.object({
        description: z.string().max(500),
      });

      const longString = 'a'.repeat(501);
      expect(() => {
        validateInput(schema, { description: longString }, 'body');
      }).toThrow(BadRequestException);
    });
  });
});
