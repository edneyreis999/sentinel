import { BaseError } from '../base.error';

// Concrete implementation for testing BaseError abstract class
class TestError extends BaseError {
  readonly statusCode = 500;
  readonly name = 'TestError';

  constructor(message: string) {
    super(message);
  }
}

describe('BaseError', () => {
  describe('instantiation', () => {
    it('should create an instance of Error', () => {
      const error = new TestError('Test error message');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(TestError);
    });

    it('should set the error message correctly', () => {
      const message = 'Something went wrong';
      const error = new TestError(message);

      expect(error.message).toBe(message);
    });

    it('should capture stack trace', () => {
      const error = new TestError('Test error');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('TestError');
    });

    it('should set statusCode from concrete class', () => {
      const error = new TestError('Test error');

      expect(error.statusCode).toBe(500);
    });

    it('should set name from concrete class', () => {
      const error = new TestError('Test error');

      expect(error.name).toBe('TestError');
    });
  });

  describe('error properties', () => {
    it('should have abstract statusCode property', () => {
      const error = new TestError('Test error');

      expect(error.statusCode).toEqual(expect.any(Number));
    });

    it('should have abstract name property', () => {
      const error = new TestError('Test error');

      expect(error.name).toEqual(expect.any(String));
    });

    it('should maintain error prototype chain', () => {
      const error = new TestError('Test error');

      expect(Object.getPrototypeOf(error)).toBe(TestError.prototype);
      expect(Object.getPrototypeOf(Object.getPrototypeOf(error))).toBe(BaseError.prototype);
      expect(Object.getPrototypeOf(Object.getPrototypeOf(Object.getPrototypeOf(error)))).toBe(Error.prototype);
    });
  });

  describe('inheritance', () => {
    it('should allow multiple concrete implementations', () => {
      class FirstError extends BaseError {
        readonly statusCode = 400;
        readonly name = 'FirstError';
        constructor(message: string) {
          super(message);
        }
      }

      class SecondError extends BaseError {
        readonly statusCode = 404;
        readonly name = 'SecondError';
        constructor(message: string) {
          super(message);
        }
      }

      const firstError = new FirstError('First error message');
      const secondError = new SecondError('Second error message');

      expect(firstError.statusCode).toBe(400);
      expect(firstError.name).toBe('FirstError');
      expect(firstError.message).toBe('First error message');

      expect(secondError.statusCode).toBe(404);
      expect(secondError.name).toBe('SecondError');
      expect(secondError.message).toBe('Second error message');
    });

    it('should maintain separate stack traces for different instances', () => {
      const error1 = new TestError('Error 1');
      const error2 = new TestError('Error 2');

      expect(error1.stack).not.toBe(error2.stack);
      expect(error1.message).not.toBe(error2.message);
    });
  });

  describe('throwing and catching', () => {
    it('should be throwable and catchable as Error', () => {
      expect(() => {
        throw new TestError('Thrown error');
      }).toThrow(Error);
    });

    it('should be throwable and catchable as TestError (concrete BaseError)', () => {
      expect(() => {
        throw new TestError('Thrown error');
      }).toThrow(TestError);
    });

    it('should be catchable and preserve error properties', () => {
      try {
        throw new TestError('Caught error message');
      } catch (error) {
        expect(error).toBeInstanceOf(TestError);
        expect((error as TestError).message).toBe('Caught error message');
        expect((error as TestError).statusCode).toBe(500);
        expect((error as TestError).name).toBe('TestError');
      }
    });

    it('should work with try-catch-finally', () => {
      let finallyExecuted = false;

      try {
        throw new TestError('Error in try block');
      } catch (error) {
        expect((error as TestError).message).toBe('Error in try block');
      } finally {
        finallyExecuted = true;
      }

      expect(finallyExecuted).toBe(true);
    });
  });

  describe('serialization', () => {
    it('should have correct properties for serialization', () => {
      const error = new TestError('Serialization test');

      // Error.message is not enumerable in JavaScript, so it won't serialize to JSON
      // This test verifies the properties are set correctly on the error object
      expect(error.name).toBe('TestError');
      expect(error.message).toBe('Serialization test');
      expect(error.statusCode).toBe(500);
    });

    it('should handle empty message', () => {
      const error = new TestError('');

      expect(error.message).toBe('');
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(10000);
      const error = new TestError(longMessage);

      expect(error.message).toBe(longMessage);
    });
  });

  describe('special characters in messages', () => {
    it.each([
      ['Message with emojis 🎉🔥'],
      ['Message with unicode: ñ, é, 中文'],
      ['Message with quotes: "single" and \'double\''],
      ['Message with newlines\nand\ttabs'],
      ['Message with special chars: @#$%^&*()'],
    ])('should handle special characters: %s', (message) => {
      const error = new TestError(message);

      expect(error.message).toBe(message);
    });
  });
});
