import { Resolution } from '../value-objects/resolution.value';
import { Md5Hash } from '../value-objects/md5hash.value';

export class ImageVariant {
  public readonly resolution: Resolution;
  public readonly md5: Md5Hash;
  public readonly ext: string;

  constructor(resolution: Resolution, md5: Md5Hash, ext: string) {
    this.resolution = resolution;
    this.md5 = md5;
    this.ext = ext.startsWith('.') ? ext.slice(1) : ext;
  }

  getOutputPath(originalName: string): string {
    // /output/{original_name}/{resolution}/{md5}.{ext}
    return `/output/${originalName}/${this.resolution.width}/${this.md5.value}.${this.ext}`;
  }
}
