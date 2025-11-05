import { GetImageProcessingTask } from './get-image-processing-task.use-case';
import { TaskRepository } from '../ports/task.repository';
import { ImageProcessingTask } from '../../domain/entities/image-processing-task.model';
import { ImageSource } from '../../domain/value-objects/image-source.value';
import { ImageVariant } from '../../domain/entities/image-variant.model';
import { Md5Hash } from '../../domain/value-objects/md5hash.value';
import { Resolution } from '../../domain/value-objects/resolution.value';

describe('GetImageProcessingTask use-case', () => {
  const buildTask = (
    status: 'pending' | 'completed' | 'failed' = 'pending',
    variantCount = 0,
  ) => {
    const source = ImageSource.from('source.png');
    const task = ImageProcessingTask.create('task-1', source);

    for (let i = 0; i < variantCount; i += 1) {
      task.addVariant(
        ImageVariant.create(
          Resolution.from(i % 2 === 0 ? '1024' : '800'),
          Md5Hash.from(`${(i + 1).toString(16).padStart(32, 'a')}`),
          ImageSource.from(`variant-${i}.png`),
        ),
      );
    }

    if (status === 'completed' && variantCount === 2) {
      task.complete();
    }

    if (status === 'failed') {
      task.fail();
    }

    return task;
  };

  it('returns the task details including variant paths', async () => {
    const findById = jest.fn();
    const repo: TaskRepository = {
      save: jest.fn(),
      findById,
    };

    const task = buildTask('completed', 2);

    findById.mockResolvedValue(task);

    const uc = new GetImageProcessingTask(repo);

    const result = await uc.execute('task-1');

    expect(findById).toHaveBeenCalledWith('task-1');
    expect(result.status).toBe('completed');
    expect(result.price).toBe(task.price.amount);
    expect(result.paths).toEqual(['variant-0.png', 'variant-1.png']);
  });

  it('returns an empty list of paths when no variants exist', async () => {
    const findById = jest.fn();
    const repo: TaskRepository = {
      save: jest.fn(),
      findById,
    };

    findById.mockResolvedValue(buildTask('pending', 0));

    const uc = new GetImageProcessingTask(repo);

    const result = await uc.execute('task-2');

    expect(result.paths).toEqual([]);
  });
});
