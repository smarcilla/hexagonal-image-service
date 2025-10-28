import { DomainEvent } from './domain-event';

export type VariantMeta = {
  resolution: number;
  md5: string;
  ext: string;
  outputPath: string;
};

export class ImageProcessedEvent implements DomainEvent {
  readonly type = 'ImageProcessed';
  readonly occurredAt: Date;

  constructor(
    public readonly taskId: string,
    public readonly variants: VariantMeta[],
  ) {
    this.occurredAt = new Date();
  }
}
