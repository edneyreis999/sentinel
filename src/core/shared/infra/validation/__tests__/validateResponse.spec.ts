import { validateResponse } from './validateResponse';
import { InternalServerErrorException } from '@nestjs/common';
import { z } from 'zod';

describe('validateResponse', () => {
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

  it('should throw InternalServerErrorException when validation fails', () => {
    const data = {
      id: 'invalid-uuid',
      name: 'Test Entity',
      status: 'invalid',
    };

    expect(() => validateResponse(schema, data)).toThrow(InternalServerErrorException);
  });

  it('should throw InternalServerErrorException with proper message', () => {
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
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const data = {
      id: 'not-a-uuid',
      name: 'Test',
      status: 'invalid',
    };

    try {
      validateResponse(schema, data);
    } catch {
      // Expected to throw
    }

    expect(consoleErrorSpy).toHaveBeenCalledWith('Response validation failed:', expect.any(Object));

    consoleErrorSpy.mockRestore();
  });
});
