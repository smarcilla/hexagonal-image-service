import { InvalidImageSourceError } from '../errors/invalid-image-source.error';

export class ImageSource {
  public readonly uri: string;

  private constructor(uri: string) {
    this.uri = uri;
  }

  static from(uri: string): ImageSource {
    if (!uri || typeof uri !== 'string' || uri.trim().length === 0) {
      throw new InvalidImageSourceError();
    }

    const trimmedUri = uri.trim();

    // Validate if it's a URL
    if (this.isUrl(trimmedUri)) {
      // Basic URL validation passed
      return new ImageSource(trimmedUri);
    }

    // Validate if it looks like a local path (non-empty string)
    // We don't check if file exists here (that's infrastructure concern)
    if (trimmedUri.length > 0) {
      return new ImageSource(trimmedUri);
    }

    throw new InvalidImageSourceError();
  }

  private static isUrl(uri: string): boolean {
    try {
      const url = new URL(uri);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  isRemote(): boolean {
    try {
      const url = new URL(this.uri);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
