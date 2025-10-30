import { InvalidResolutionError } from '../errors/invalid-resolution.error';

export class Resolution {
  public readonly width: number;

  private constructor(width: number) {
    this.width = width;
  }

  static readonly allowed = [1024, 800];

  static from(width: number): Resolution {
    if (!this.allowed.includes(width)) {
      throw new InvalidResolutionError(
        `Invalid resolution: ${width}. Allowed: ${this.allowed.join(', ')}`,
      );
    }
    return new Resolution(width);
  }
}
