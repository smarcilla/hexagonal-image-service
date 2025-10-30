import { ImageSource } from '../value-objects/image-source.value';
import { Money } from '../value-objects/money.value';
import { ImageVariant } from './image-variant.model';
import { AddVariantError } from '../errors/add-variant.error';
import { CompleteTaskError } from '../errors/complete-task.error';
import { FailedTaskError } from '../errors/failed-task.error';

export type TaskStatus = 'pending' | 'completed' | 'failed';

export class ImageProcessingTask {
  public readonly id: string;
  public readonly source: ImageSource;
  public readonly price: Money;
  private _status: TaskStatus = 'pending';
  private _variants: ImageVariant[] = [];

  private constructor(id: string, source: ImageSource, price?: Money) {
    this.id = id;
    this.source = source;
    this.price = price ?? Money.randomBetween();
  }

  static create(id: string, source: ImageSource): ImageProcessingTask {
    return new ImageProcessingTask(id, source);
  }

  get status(): TaskStatus {
    return this._status;
  }

  get variants(): ReadonlyArray<ImageVariant> {
    return this._variants.slice();
  }

  addVariant(variant: ImageVariant) {
    if (this._status !== 'pending') {
      throw new AddVariantError('Cannot add variant unless task is pending');
    }
    this._variants.push(variant);
  }

  complete() {
    if (this._status !== 'pending') {
      throw new CompleteTaskError('Only pending tasks can be completed');
    }
    if (this._variants.length !== 2) {
      throw new CompleteTaskError(
        'A completed task must have exactly 2 variants',
      );
    }
    this._status = 'completed';
  }

  fail() {
    if (this._status !== 'pending') {
      throw new FailedTaskError('Only pending tasks can be failed');
    }
    this._status = 'failed';
  }
}
