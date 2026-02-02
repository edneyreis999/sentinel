import { BaseError } from './base.error';

export class DomainError extends BaseError {
  readonly statusCode = 400;
  readonly name = 'DomainError';

  constructor(message: string) {
    super(message);
  }
}
