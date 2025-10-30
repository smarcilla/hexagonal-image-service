import { Resolution } from '../value-objects/resolution.value';
import { Md5Hash } from '../value-objects/md5hash.value';
import { ImageSource } from '../value-objects/image-source.value';

export class ImageVariant {
  public readonly resolution: Resolution;
  public readonly md5: Md5Hash;
  public readonly path: ImageSource;

  constructor(resolution: Resolution, md5: Md5Hash, path: ImageSource) {
    this.resolution = resolution;
    this.md5 = md5;
    this.path = path;
  }

  static create(
    resolution: Resolution,
    md5: Md5Hash,
    path: ImageSource,
  ): ImageVariant {
    return new ImageVariant(resolution, md5, path);
  }
}
