import { ImageVariant } from '../entities/image-variant.model';
import { DomainEvent } from './domain-event';

export class ImageProcessedEvent implements DomainEvent {
  readonly type = 'ImageProcessed';
  readonly occurredAt: Date;

  constructor(
    public readonly taskId: string,
    public readonly variants: ImageVariant[],
  ) {
    this.occurredAt = new Date();
  }
}
