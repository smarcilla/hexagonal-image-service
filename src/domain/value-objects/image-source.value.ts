import { InvalidImageSourceError } from '../errors/invalid-image-source.error';

export class ImageSource {
  public readonly uri: string;

  private constructor(uri: string) {
    this.uri = uri;
  }

  static from(uri: string): ImageSource {
    if (!uri || typeof uri !== 'string') {
      throw new InvalidImageSourceError();
    }
    // Basic validation: either a URL or a local path
    return new ImageSource(uri);
  }
}
