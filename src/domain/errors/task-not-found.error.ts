import { DomainError } from './domain.error';

export class TaskNotFoundError extends DomainError {
  constructor(public readonly taskId: string) {
    super(`Task with id '${taskId}' not found`);
    this.name = 'TaskNotFoundError';
  }
}
