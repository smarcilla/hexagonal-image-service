import { ImageProcessingTask } from './image-processing-task.model';
import { ImageSource } from '../value-objects/image-source.value';
import { Resolution } from '../value-objects/resolution.value';
import { Md5Hash } from '../value-objects/md5hash.value';
import { ImageVariant } from './image-variant.model';

describe('ImageProcessingTask (domain)', () => {
  it('creates a task with a random price between 5 and 50', () => {
    const task = ImageProcessingTask.create('t1', ImageSource.from('file.jpg'));
    expect(typeof task.price.amount).toBe('number');
    expect(task.price.amount).toBeGreaterThanOrEqual(5);
    expect(task.price.amount).toBeLessThanOrEqual(50);
  });

  it('completes only when there are exactly 2 variants', () => {
    const task = ImageProcessingTask.create('t2', ImageSource.from('file.jpg'));

    const v1 = ImageVariant.create(
      Resolution.from('1024'),
      Md5Hash.from('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
      ImageSource.from('file1.jpg'),
    );
    const v2 = ImageVariant.create(
      Resolution.from('800'),
      Md5Hash.from('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'),
      ImageSource.from('file2.png'),
    );

    task.addVariant(v1);
    expect(() => task.complete()).toThrow();

    task.addVariant(v2);
    expect(() => task.complete()).not.toThrow();
    expect(task.status).toBe('completed');
  });

  it('throws when trying to complete with incorrect number of variants', () => {
    const task = ImageProcessingTask.create('t3', ImageSource.from('file.jpg'));
    expect(() => task.complete()).toThrow();
    const v = ImageVariant.create(
      Resolution.from('1024'),
      Md5Hash.from('cccccccccccccccccccccccccccccccc'),
      ImageSource.from('file3.jpg'),
    );
    task.addVariant(v);
    expect(() => task.complete()).toThrow();
  });
});
