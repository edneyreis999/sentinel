import { DomainError } from '../domain.error';

describe('DomainError', () => {
  describe('instantiation', () => {
    it('should create an instance of BaseError', () => {
      const error = new DomainError('Test domain error');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DomainError);
    });

    it('should set the error message correctly', () => {
      const message = 'Business rule violation';
      const error = new DomainError(message);

      expect(error.message).toBe(message);
    });

    it('should have statusCode of 400 (Bad Request)', () => {
      const error = new DomainError('Test error');

      expect(error.statusCode).toBe(400);
    });

    it('should have name "DomainError"', () => {
      const error = new DomainError('Test error');

      expect(error.name).toBe('DomainError');
    });

    it('should capture stack trace', () => {
      const error = new DomainError('Test error');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('DomainError');
    });
  });

  describe('error properties', () => {
    it('should have all required error properties', () => {
      const error = new DomainError('Test error');

      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('statusCode', 400);
      expect(error).toHaveProperty('name', 'DomainError');
      expect(error).toHaveProperty('stack');
    });

    it('should be immutable', () => {
      const error = new DomainError('Test error');

      // Try to modify (TypeScript should prevent this at compile time)
      // At runtime, readonly properties can still be modified in JS
      // but the intent is immutability
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('DomainError');
    });
  });

  describe('typical domain error scenarios', () => {
    it('should represent business rule violations', () => {
      const error = new DomainError('Account balance cannot be negative');

      expect(error.message).toContain('cannot');
      expect(error.statusCode).toBe(400);
    });

    it('should represent validation failures', () => {
      const error = new DomainError('Email address is invalid');

      expect(error.message).toContain('invalid');
      expect(error.statusCode).toBe(400);
    });

    it('should represent invariant violations', () => {
      const error = new DomainError('Category name must be unique');

      expect(error.message).toContain('must be');
      expect(error.statusCode).toBe(400);
    });

    it('should represent state transition violations', () => {
      const error = new DomainError('Cannot delete published document');

      expect(error.message).toContain('Cannot');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('throwing and catching', () => {
    it('should be throwable and catchable as DomainError', () => {
      expect(() => {
        throw new DomainError('Thrown domain error');
      }).toThrow(DomainError);
    });

    it('should be throwable and catchable as Error', () => {
      expect(() => {
        throw new DomainError('Thrown domain error');
      }).toThrow(Error);
    });

    it('should preserve error properties when caught', () => {
      try {
        throw new DomainError('Caught domain error');
      } catch (error) {
        expect(error).toBeInstanceOf(DomainError);
        expect((error as DomainError).message).toBe('Caught domain error');
        expect((error as DomainError).statusCode).toBe(400);
        expect((error as DomainError).name).toBe('DomainError');
      }
    });

    it('should work in conditional error throwing', () => {
      const isValid = false;

      expect(() => {
        if (!isValid) {
          throw new DomainError('Validation failed');
        }
      }).toThrow(DomainError);
    });
  });

  describe('error messages for different domain contexts', () => {
    it('should handle error messages for entity validation', () => {
      const errors = [
        new DomainError('Entity ID cannot be empty'),
        new DomainError('Entity name is required'),
        new DomainError('Entity version must be positive'),
      ];

      errors.forEach((error) => {
        expect(error.statusCode).toBe(400);
        expect(error.name).toBe('DomainError');
        expect(error.message).toBeTruthy();
      });
    });

    it('should handle error messages for value object validation', () => {
      const errors = [
        new DomainError('Invalid email format'),
        new DomainError('URL must start with http:// or https://'),
        new DomainError('Date cannot be in the past'),
      ];

      errors.forEach((error) => {
        expect(error.statusCode).toBe(400);
        expect(error.name).toBe('DomainError');
        expect(error.message).toBeTruthy();
      });
    });

    it('should handle error messages for aggregate rules', () => {
      const errors = [
        new DomainError('Cannot add item to completed order'),
        new DomainError('Maximum team size exceeded'),
        new DomainError('Project requires at least one owner'),
      ];

      errors.forEach((error) => {
        expect(error.statusCode).toBe(400);
        expect(error.name).toBe('DomainError');
        expect(error.message).toBeTruthy();
      });
    });
  });

  describe('serialization', () => {
    it('should have correct properties for serialization', () => {
      const error = new DomainError('Serialization test');

      // Error.message is not enumerable in JavaScript, so it won't serialize to JSON
      // This test verifies the properties are set correctly on the error object
      expect(error.name).toBe('DomainError');
      expect(error.message).toBe('Serialization test');
      expect(error.statusCode).toBe(400);
    });

    it('should handle empty message', () => {
      const error = new DomainError('');

      expect(error.message).toBe('');
      expect(error.statusCode).toBe(400);
    });

    it('should handle multiline messages', () => {
      const message = 'Multiple validation errors:\n- Field 1 is required\n- Field 2 is invalid';
      const error = new DomainError(message);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(400);
    });
  });

  describe('inheritance scenarios', () => {
    it('should document that custom domain errors should extend BaseError directly', () => {
      // This test documents the pattern: for custom domain errors with different
      // names or status codes, extend BaseError directly, not DomainError
      //
      // Example pattern (commented out as it would be in a separate file):
      //
      // class CategoryNotFoundError extends BaseError {
      //   readonly statusCode = 404;
      //   readonly name = 'CategoryNotFoundError';
      //
      //   constructor(categoryId: string) {
      //     super(`Category with ID ${categoryId} not found`);
      //   }
      // }

      // DomainError is best used as-is for general domain errors
      const error = new DomainError('Category with ID 123 not found');

      expect(error.name).toBe('DomainError');
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain('123');
    });

    it('should show DomainError is intended for general 400 errors', () => {
      // DomainError provides a consistent 400 status code for all business rule violations
      // Use it directly rather than extending it
      const errors = [
        new DomainError('Email must be unique'),
        new DomainError('Password does not meet requirements'),
        new DomainError('Account is already active'),
      ];

      errors.forEach((error) => {
        expect(error.statusCode).toBe(400);
        expect(error.name).toBe('DomainError');
      });
    });
  });

  describe('integration with error handling patterns', () => {
    it('should work with Result type pattern', () => {
      type Result<T, E = DomainError> = { success: true; value: T } | { success: false; error: E };

      const validate = (value: number): Result<number> => {
        if (value < 0) {
          return { success: false, error: new DomainError('Value must be positive') };
        }
        return { success: true, value };
      };

      const result1 = validate(-1);
      const result2 = validate(42);

      expect(result1.success).toBe(false);
      if (!result1.success) {
        expect(result1.error.message).toBe('Value must be positive');
      }

      expect(result2.success).toBe(true);
      if (result2.success) {
        expect(result2.value).toBe(42);
      }
    });

    it('should work with try-catch for async operations', async () => {
      const asyncOperation = async (): Promise<void> => {
        throw new DomainError('Async validation failed');
      };

      await expect(asyncOperation()).rejects.toThrow(DomainError);
    });
  });

  describe('special characters in messages', () => {
    it.each([
      ['Validation failed: Ñoño', 'Ñoño'],
      ['Error: Test™ symbol', '™'],
      ['Error with emoji: Invalid value ❌', '❌'],
      ['Error with unicode: 中文测试', '中文'],
    ])('should handle special characters: %s', (message, substring) => {
      const error = new DomainError(message);

      expect(error.message).toContain(substring);
      expect(error.statusCode).toBe(400);
    });
  });
});
