import { BaseError } from './base.error';

export class NotFoundError extends BaseError {
  readonly statusCode = 404;
  readonly name = 'NotFoundError';

  constructor(id: string, entityName: string) {
    super(`${entityName} with id ${id} not found`);
  }
}
