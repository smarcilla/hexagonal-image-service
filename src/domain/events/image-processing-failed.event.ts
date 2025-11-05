import { DomainEvent } from './domain-event';

export class ImageProcessingFailed implements DomainEvent {
  readonly type = 'ImageProcessingFailed';
  readonly occurredAt: Date;

  constructor(
    public readonly taskId: string,
    public readonly error: string,
  ) {
    this.occurredAt = new Date();
  }
}
