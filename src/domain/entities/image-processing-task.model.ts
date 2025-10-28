import { ImageSource } from '../value-objects/image-source.value';
import { Money } from '../value-objects/money.value';
import { ImageVariant } from './image-variant.model';
import { DomainError } from '../errors/domain-error';

export type TaskStatus = 'pending' | 'completed' | 'failed';

export class ImageProcessingTask {
  public readonly id: string;
  public readonly source: ImageSource;
  public readonly price: Money;
  private _status: TaskStatus = 'pending';
  private _variants: ImageVariant[] = [];

  constructor(id: string, source: ImageSource, price?: Money) {
    this.id = id;
    this.source = source;
    this.price = price ?? Money.randomBetween();
  }

  get status(): TaskStatus {
    return this._status;
  }

  get variants(): ReadonlyArray<ImageVariant> {
    return this._variants.slice();
  }

  addVariant(variant: ImageVariant) {
    if (this._status !== 'pending') {
      throw new DomainError('Cannot add variant unless task is pending');
    }
    this._variants.push(variant);
  }

  complete() {
    if (this._status !== 'pending') {
      throw new DomainError('Only pending tasks can be completed');
    }
    if (this._variants.length !== 2) {
      throw new DomainError('A completed task must have exactly 2 variants');
    }
    this._status = 'completed';
  }

  fail() {
    if (this._status !== 'pending') {
      throw new DomainError('Only pending tasks can be failed');
    }
    this._status = 'failed';
  }
}
