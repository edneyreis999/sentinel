import { BadRequestException } from '@nestjs/common';

interface ValidationError {
  field: string;
  source: string;
  message?: string;
}

/**
 * Custom Jest matcher for validation errors
 * Provides clear, descriptive assertions for validation error structures
 */
const toHaveValidationErrors = function (
  received: unknown,
  expectedErrors: ValidationError[],
): jest.CustomMatcherResult {
  if (!(received instanceof BadRequestException)) {
    return {
      pass: false,
      message: () =>
        `Expected BadRequestException, received ${received?.constructor?.name || typeof received}`,
    };
  }

  const response = received.getResponse();
  const errors =
    typeof response === 'object' && response !== null && 'message' in response
      ? (response as { message: unknown }).message
      : response;

  if (!Array.isArray(errors)) {
    return {
      pass: false,
      message: () =>
        `Expected validation errors array, received ${typeof errors}: ${JSON.stringify(errors)}`,
    };
  }

  const missingErrors: ValidationError[] = [];
  const extraErrors: unknown[] = [];

  // Check if all expected errors exist
  for (const expected of expectedErrors) {
    const found = errors.some(
      (err: unknown) =>
        typeof err === 'object' &&
        err !== null &&
        'field' in err &&
        'source' in err &&
        err.field === expected.field &&
        err.source === expected.source,
    );

    if (!found) {
      missingErrors.push(expected);
    }
  }

  // Check for unexpected errors
  for (const error of errors) {
    if (typeof error === 'object' && error !== null && 'field' in error && 'source' in error) {
      const expected = expectedErrors.some(
        (exp: ValidationError) => exp.field === error.field && exp.source === error.source,
      );
      if (!expected) {
        extraErrors.push(error);
      }
    }
  }

  const pass = missingErrors.length === 0 && extraErrors.length === 0;

  return {
    pass,
    message: () => {
      if (!pass) {
        let msg = 'Validation errors mismatch:\n';
        if (missingErrors.length > 0) {
          msg += `  Missing errors: ${JSON.stringify(missingErrors, null, 2)}\n`;
        }
        if (extraErrors.length > 0) {
          msg += `  Extra errors: ${JSON.stringify(extraErrors, null, 2)}\n`;
        }
        msg += `  Received: ${JSON.stringify(errors, null, 2)}`;
        return msg;
      }
      return `Expected NOT to have validation errors ${JSON.stringify(expectedErrors)}`;
    },
  };
};

/**
 * Custom Jest matcher to check if an error has a specific field error
 */
const toHaveFieldError = function (
  received: unknown,
  field: string,
  source = 'body',
): jest.CustomMatcherResult {
  if (!(received instanceof BadRequestException)) {
    return {
      pass: false,
      message: () =>
        `Expected BadRequestException, received ${received?.constructor?.name || typeof received}`,
    };
  }

  const response = received.getResponse();
  const errors =
    typeof response === 'object' && response !== null && 'message' in response
      ? (response as { message: unknown }).message
      : response;

  if (!Array.isArray(errors)) {
    return {
      pass: false,
      message: () => `Expected validation errors array, received ${typeof errors}`,
    };
  }

  const found = errors.some(
    (err: unknown) =>
      typeof err === 'object' &&
      err !== null &&
      'field' in err &&
      'source' in err &&
      err.field === field &&
      err.source === source,
  );

  return {
    pass: found,
    message: () =>
      found
        ? `Expected NOT to have error for field "${field}" in "${source}"`
        : `Expected to have error for field "${field}" in "${source}", received: ${JSON.stringify(errors)}`,
  };
};

export { toHaveValidationErrors, toHaveFieldError };

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveValidationErrors(expectedErrors: ValidationError[]): R;
      toHaveFieldError(field: string, source?: string): R;
    }
  }
}
