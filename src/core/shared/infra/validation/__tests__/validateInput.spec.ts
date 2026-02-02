import { validateInput } from './validateInput';
import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

describe('validateInput', () => {
  const schema = z.object({
    name: z.string().min(3),
    email: z.string().email(),
    age: z.number().min(18).optional(),
  });

  it('should validate and return parsed data when input is valid', () => {
    const input = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 25,
    };

    const result = validateInput(schema, input, 'body');

    expect(result).toEqual(input);
  });

  it('should validate and return parsed data without optional fields', () => {
    const input = {
      name: 'Jane Doe',
      email: 'jane@example.com',
    };

    const result = validateInput(schema, input, 'body');

    expect(result).toEqual(input);
  });

  it('should throw BadRequestException when validation fails', () => {
    const input = {
      name: 'Jo', // Too short
      email: 'invalid-email', // Invalid format
    };

    expect(() => validateInput(schema, input, 'body')).toThrow(BadRequestException);
  });

  it('should include error details with field, message and source', () => {
    const input = {
      name: 'Jo',
      email: 'invalid-email',
    };

    try {
      validateInput(schema, input, 'query');
      fail('Should have thrown BadRequestException');
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

  it('should handle nested field paths', () => {
    const nestedSchema = z.object({
      user: z.object({
        name: z.string().min(3),
      }),
    });

    const input = {
      user: {
        name: 'Jo',
      },
    };

    try {
      validateInput(nestedSchema, input, 'body');
      fail('Should have thrown BadRequestException');
    } catch (error) {
      const response = (error as BadRequestException).getResponse() as {
        message: Array<{ field: string; message: string; source: string }>;
      };
      expect(response.message[0].field).toBe('user.name');
    }
  });
});
