import { DomainError } from './domain.error';

// src/domain/errors/invalid-money.error.ts
export class InvalidMoneyError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMoneyError';
  }
}
