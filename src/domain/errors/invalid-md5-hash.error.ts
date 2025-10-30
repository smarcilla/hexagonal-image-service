import { DomainError } from './domain.error';

export class InvalidMd5HashError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMd5HashError';
  }
}
