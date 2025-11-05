import { InMemoryTaskRepository } from './in-memory-task.repository';
import { ImageProcessingTask } from '../../domain/entities/image-processing-task.model';
import { ImageSource } from '../../domain/value-objects/image-source.value';

describe('InMemoryTaskRepository (infrastructure)', () => {
  it('persists and retrieves tasks by id', async () => {
    const repo = new InMemoryTaskRepository();
    const task = ImageProcessingTask.create(
      'task-1',
      ImageSource.from('image.png'),
    );

    await repo.save(task);

    const stored = await repo.findById('task-1');

    expect(stored).toBe(task);
  });

  it('throws when looking up a missing task', () => {
    const repo = new InMemoryTaskRepository();

    expect(() => repo.findById('missing')).toThrow(
      'Task with id missing not found',
    );
  });
});
