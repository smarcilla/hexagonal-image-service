import { DomainError } from './domain.error';

export class InvalidImageSourceError extends DomainError {
  constructor(message = 'Invalid image source') {
    super(message);
    this.name = 'InvalidImageSourceError';
  }
}
