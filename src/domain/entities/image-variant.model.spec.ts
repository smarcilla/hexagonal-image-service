import { ImageVariant } from './image-variant.model';
import { Resolution } from '../value-objects/resolution.value';
import { Md5Hash } from '../value-objects/md5hash.value';
import { ImageSource } from '../value-objects/image-source.value';

describe('ImageVariant (domain)', () => {
  it('creates a variant with the provided value objects', () => {
    const resolution = Resolution.from('1024');
    const md5 = Md5Hash.from('1234567890abcdef1234567890abcdef');
    const path = ImageSource.from('variant.png');

    const variant = ImageVariant.create(resolution, md5, path);

    expect(variant.resolution).toBe(resolution);
    expect(variant.md5).toBe(md5);
    expect(variant.path).toBe(path);
  });
});
