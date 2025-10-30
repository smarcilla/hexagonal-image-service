import { DomainError } from './domain.error';

export class CompleteTaskError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'CompleteTaskError';
  }
}
