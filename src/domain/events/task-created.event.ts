import { DomainEvent } from './domain-event';

export class TaskCreatedEvent implements DomainEvent {
  readonly type = 'TaskCreated';
  readonly occurredAt: Date;

  constructor(
    public readonly taskId: string,
    public readonly source: string,
  ) {
    this.occurredAt = new Date();
  }
}
