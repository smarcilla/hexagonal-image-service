import { DomainError } from './domain.error';

export class FailedTaskError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'FailedTaskError';
  }
}
