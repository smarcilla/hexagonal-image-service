import { DomainError } from './domain.error';

export class AddVariantError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'AddVariantError';
  }
}
