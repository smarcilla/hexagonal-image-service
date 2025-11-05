import { ImageSource } from './image-source.value';
import { InvalidImageSourceError } from '../errors/invalid-image-source.error';

describe('ImageSource (domain)', () => {
  it('creates a source from a remote URL and flags it as remote', () => {
    const source = ImageSource.from('https://example.com/image.jpg');

    expect(source.uri).toBe('https://example.com/image.jpg');
    expect(source.isRemote()).toBe(true);
  });

  it('creates a source from a local path and flags it as local', () => {
    const source = ImageSource.from('images/photo.png');

    expect(source.uri).toBe('images/photo.png');
    expect(source.isRemote()).toBe(false);
  });

  it('trims whitespace from the provided uri', () => {
    const source = ImageSource.from('   /tmp/image.png   ');

    expect(source.uri).toBe('/tmp/image.png');
  });

  it('throws an error when the uri is empty or whitespace', () => {
    expect(() => ImageSource.from('')).toThrow(InvalidImageSourceError);
    expect(() => ImageSource.from('   ')).toThrow(InvalidImageSourceError);
  });
});
