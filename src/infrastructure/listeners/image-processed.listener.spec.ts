import { ImageProcessedListenerAdapter } from './image-processed.listener';
import {
  EventBus,
  ImageProcessedQueue,
  ImageProcessingFailedQueue,
} from '../../application/ports/event.bus';
import { TaskRepository } from '../../application/ports/task.repository';
import { ImageProcessedEvent } from '../../domain/events/image-processed.event';
import { ImageProcessingFailed } from '../../domain/events/image-processing-failed.event';
import { ImageProcessingTask } from '../../domain/entities/image-processing-task.model';
import { ImageVariant } from '../../domain/entities/image-variant.model';
import { Resolution } from '../../domain/value-objects/resolution.value';
import { Md5Hash } from '../../domain/value-objects/md5hash.value';
import { ImageSource } from '../../domain/value-objects/image-source.value';

const createVariant = (res: '1024' | '800', suffix: string) =>
  ImageVariant.create(
    Resolution.from(res),
    Md5Hash.from(suffix.repeat(32)),
    ImageSource.from(`output-${res}.png`),
  );

describe('ImageProcessedListenerAdapter (infrastructure)', () => {
  const setup = () => {
    const subscriptions: Record<string, (event: unknown) => Promise<void>> = {};

    const eventBus = {
      publish: jest.fn(),
      dispose: jest.fn(),
      subscribe: jest.fn(
        (type: string, handler: (event: unknown) => Promise<void>) => {
          subscriptions[type] = handler;
        },
      ),
    } as unknown as EventBus;

    const taskRepo = {
      findById: jest.fn(),
      save: jest.fn(),
    };

    // instantiate adapter to register subscriptions
    new ImageProcessedListenerAdapter(
      eventBus,
      taskRepo as unknown as TaskRepository,
    );

    return { eventBus, taskRepo, subscriptions };
  };

  it('completes a task when image processing succeeds', async () => {
    const { subscriptions, taskRepo } = setup();
    const handler = subscriptions[ImageProcessedQueue] as (
      event: ImageProcessedEvent,
    ) => Promise<void>;

    const task = ImageProcessingTask.create(
      'task-1',
      ImageSource.from('input.png'),
    );

    taskRepo.findById.mockResolvedValue(task);
    taskRepo.save.mockResolvedValue(() => {});

    const event = new ImageProcessedEvent('task-1', [
      createVariant('1024', 'a'),
      createVariant('800', 'b'),
    ]);

    await handler(event);

    expect(task.status).toBe('completed');
    expect(task.variants).toHaveLength(2);
    expect(taskRepo.save).toHaveBeenCalledWith(task);
  });

  it('marks a task as failed when processing fails', async () => {
    const { subscriptions, taskRepo } = setup();

    const handler = subscriptions[ImageProcessingFailedQueue] as (
      event: ImageProcessingFailed,
    ) => Promise<void>;

    const task = ImageProcessingTask.create(
      'task-1',
      ImageSource.from('input.png'),
    );

    taskRepo.findById.mockResolvedValue(task);
    taskRepo.save.mockResolvedValue(() => {});

    await handler(new ImageProcessingFailed('task-1', 'boom'));

    expect(task.status).toBe('failed');
    expect(taskRepo.save).toHaveBeenCalledWith(task);
  });

  it('no-ops when failing event targets a missing task', async () => {
    const { subscriptions, taskRepo } = setup();

    const handler = subscriptions[ImageProcessingFailedQueue] as (
      event: ImageProcessingFailed,
    ) => Promise<void>;

    taskRepo.findById.mockResolvedValue(
      undefined as unknown as ImageProcessingTask,
    );

    await handler(new ImageProcessingFailed('missing', 'boom'));

    expect(taskRepo.save).not.toHaveBeenCalled();
  });

  it('propagates repository errors when completing a task', async () => {
    const { subscriptions, taskRepo } = setup();
    const handler = subscriptions[ImageProcessedQueue] as (
      event: ImageProcessedEvent,
    ) => Promise<void>;

    taskRepo.findById.mockRejectedValue(new Error('db down'));

    await expect(
      handler(
        new ImageProcessedEvent('task-1', [
          createVariant('1024', 'c'),
          createVariant('800', 'd'),
        ]),
      ),
    ).rejects.toThrow('db down');
    expect(taskRepo.save).not.toHaveBeenCalled();
  });
});
