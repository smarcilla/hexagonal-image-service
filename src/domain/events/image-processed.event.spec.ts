import { ImageProcessedEvent } from './image-processed.event';
import { ImageVariant } from '../entities/image-variant.model';
import { Resolution } from '../value-objects/resolution.value';
import { Md5Hash } from '../value-objects/md5hash.value';
import { ImageSource } from '../value-objects/image-source.value';

describe('ImageProcessedEvent (domain)', () => {
  it('contains the processed variants and metadata', () => {
    const variants = [
      ImageVariant.create(
        Resolution.from('1024'),
        Md5Hash.from('abcdefabcdefabcdefabcdefabcdefab'),
        ImageSource.from('variant-1.png'),
      ),
      ImageVariant.create(
        Resolution.from('800'),
        Md5Hash.from('1234567890abcdef1234567890abcdef'),
        ImageSource.from('variant-2.png'),
      ),
    ];

    const event = new ImageProcessedEvent('task-123', variants);

    expect(event.type).toBe('ImageProcessed');
    expect(event.taskId).toBe('task-123');
    expect(event.variants).toBe(variants);
    expect(event.occurredAt).toBeInstanceOf(Date);
  });
});
