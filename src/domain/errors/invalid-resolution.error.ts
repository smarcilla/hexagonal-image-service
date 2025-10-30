import { DomainError } from './domain.error';

export class InvalidResolutionError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidResolutionError';
  }
}
