export type AllowedResolutions = '1024' | '800';

export class Resolution {
  public readonly width: AllowedResolutions;

  private constructor(width: AllowedResolutions) {
    this.width = width;
  }

  static from(width: AllowedResolutions): Resolution {
    return new Resolution(width);
  }
}
