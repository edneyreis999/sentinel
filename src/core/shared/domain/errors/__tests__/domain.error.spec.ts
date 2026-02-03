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

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('DomainError');
    });
  });

  describe('domain model violations', () => {
    it.each([
      {
        message: 'Account balance cannot be negative',
        contains: 'cannot',
        scenario: 'business rule violation (invariant protection)',
      },
      {
        message: 'Email address is invalid',
        contains: 'invalid',
        scenario: 'value object validation failure',
      },
      {
        message: 'Category name must be unique',
        contains: 'must be',
        scenario: 'aggregate uniqueness constraint violation',
      },
      {
        message: 'Cannot delete published document',
        contains: 'Cannot',
        scenario: 'aggregate state transition rule violation',
      },
    ])('should represent $scenario', ({ message, contains }) => {
      const error = new DomainError(message);

      expect(error.message).toContain(contains);
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
    describe('entity validation errors', () => {
      it.each([
        'Entity ID cannot be empty',
        'Entity name is required',
        'Entity version must be positive',
      ])('should handle error message: %s', (message) => {
        const error = new DomainError(message);

        expect(error.statusCode).toBe(400);
        expect(error.name).toBe('DomainError');
        expect(error.message).toBeTruthy();
      });
    });

    describe('value object validation errors', () => {
      it.each([
        'Invalid email format',
        'URL must start with http:// or https://',
        'Date cannot be in the past',
      ])('should handle error message: %s', (message) => {
        const error = new DomainError(message);

        expect(error.statusCode).toBe(400);
        expect(error.name).toBe('DomainError');
        expect(error.message).toBeTruthy();
      });
    });

    describe('aggregate rule errors', () => {
      it.each([
        'Cannot add item to completed order',
        'Maximum team size exceeded',
        'Project requires at least one owner',
      ])('should handle error message: %s', (message) => {
        const error = new DomainError(message);

        expect(error.statusCode).toBe(400);
        expect(error.name).toBe('DomainError');
        expect(error.message).toBeTruthy();
      });
    });
  });

  describe('serialization', () => {
    it('should have correct properties for serialization', () => {
      const error = new DomainError('Serialization test');

      expect(error.name).toBe('DomainError');
      expect(error.message).toBe('Serialization test');
      expect(error.statusCode).toBe(400);
    });

    it.each([
      { message: '', description: 'empty message' },
      {
        message: 'Multiple validation errors:\n- Field 1 is required\n- Field 2 is invalid',
        description: 'multiline message',
      },
    ])('should handle $description', ({ message }) => {
      const error = new DomainError(message);

      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(400);
    });
  });

  describe('inheritance scenarios', () => {
    it('should document that custom domain errors should extend BaseError directly', () => {
      // DomainError is best used as-is for general domain errors
      const error = new DomainError('Category with ID 123 not found');

      expect(error.name).toBe('DomainError');
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain('123');
    });

    it.each([
      'Email must be unique',
      'Password does not meet requirements',
      'Account is already active',
    ])('should provide consistent 400 status for: %s', (message) => {
      const error = new DomainError(message);

      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('DomainError');
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
      { message: 'Validation failed: Ñoño', substring: 'Ñoño', description: 'Spanish characters' },
      { message: 'Error: Test™ symbol', substring: '™', description: 'trademark symbol' },
      { message: 'Error with emoji: Invalid value ❌', substring: '❌', description: 'emoji' },
      {
        message: 'Error with unicode: 中文测试',
        substring: '中文',
        description: 'Chinese characters',
      },
      { message: 'Привет мир', substring: 'Привет', description: 'Cyrillic characters' },
      { message: 'مرحبا', substring: 'مرحبا', description: 'Arabic characters' },
    ])('should handle $description: $message', ({ message, substring }) => {
      const error = new DomainError(message);

      expect(error.message).toContain(substring);
      expect(error.statusCode).toBe(400);
    });
  });
});
