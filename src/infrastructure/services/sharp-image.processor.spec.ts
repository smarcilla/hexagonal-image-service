import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';
import sharp from 'sharp';

import { SharpImageProcessor } from './sharp-image.processor';
import { EventBus, TaskCreatedQueue } from '../../application/ports/event.bus';
import { TaskRepository } from '../../application/ports/task.repository';
import { FileDownloader } from '../../application/ports/file.downloader';
import { TaskCreatedEvent } from '../../domain/events/task-created.event';
import { ImageProcessingTask } from '../../domain/entities/image-processing-task.model';
import { ImageSource } from '../../domain/value-objects/image-source.value';
import { ImageProcessedEvent } from '../../domain/events/image-processed.event';
import { ImageProcessingFailed } from '../../domain/events/image-processing-failed.event';
import { DomainEvent } from '../../domain/events/domain-event';

type SharpInstanceMocks = { resize: jest.Mock; toFile: jest.Mock };

declare module 'sharp' {
  interface Sharp {
    __mock?: { instances: SharpInstanceMocks[] };
  }
}

const fsModule = fs as unknown as { mkdir: jest.Mock };
const sharpMock = sharp as unknown as jest.Mock & {
  __mock: { instances: SharpInstanceMocks[] };
};

jest.mock('fs/promises', () => {
  const mkdir = jest.fn();
  return {
    __esModule: true,
    default: { mkdir },
    mkdir,
  };
});

jest.mock('sharp', () => {
  const instances: SharpInstanceMocks[] = [];
  const mockSharp = jest.fn().mockImplementation(() => {
    const toFile = jest.fn().mockResolvedValue(undefined);
    const resize = jest.fn().mockReturnValue({ toFile });
    instances.push({ resize, toFile });
    return { resize };
  });
  Object.assign(mockSharp, { __mock: { instances } });
  return {
    __esModule: true,
    default: mockSharp,
  };
});

describe('SharpImageProcessor (infrastructure)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sharpMock.__mock.instances.length = 0;
  });

  const createTask = (uri = 'https://example.com/input.jpg') =>
    ImageProcessingTask.create('task-1', ImageSource.from(uri));

  const buildProcessor = () => {
    const subscriptions: Record<string, (event: DomainEvent) => Promise<void>> =
      {};

    const eventBusMock: jest.Mocked<EventBus> = {
      publish: jest.fn(),
      dispose: jest.fn(),
      subscribe: jest.fn((eventType, handler) => {
        subscriptions[eventType] = async (event: DomainEvent) => {
          await handler(event);
        };
      }),
    };
    eventBusMock.publish.mockResolvedValue(undefined);

    const taskRepoMock: jest.Mocked<TaskRepository> = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const fileDownloaderMock: jest.Mocked<FileDownloader> = {
      download: jest.fn(),
    };

    const processor = new SharpImageProcessor(
      eventBusMock,
      taskRepoMock,
      fileDownloaderMock,
    );

    return {
      processor,
      eventBusMock,
      taskRepoMock,
      fileDownloaderMock,
      subscriptions,
    };
  };

  it('subscribes to TaskCreated events on construction', () => {
    const { eventBusMock } = buildProcessor();

    const subscribeCalls = eventBusMock.subscribe.mock.calls as Array<
      [string, (event: DomainEvent) => Promise<void>]
    >;
    expect(subscribeCalls[0][0]).toBe(TaskCreatedQueue);
    expect(typeof subscribeCalls[0][1]).toBe('function');
  });

  it('produces resized variants and publishes the processed event', async () => {
    const { processor, eventBusMock, fileDownloaderMock } = buildProcessor();

    const task = createTask('https://example.com/photo.jpeg');
    const buffer = Buffer.from('image-content');
    const expectedMd5 = crypto.createHash('md5').update(buffer).digest('hex');

    fileDownloaderMock.download.mockResolvedValue(buffer);

    await processor.process(task);

    expect(fileDownloaderMock.download.mock.calls[0][0]).toBe(
      'https://example.com/photo.jpeg',
    );
    expect(fsModule.mkdir.mock.calls[0]).toEqual([
      path.join('images/output', 'photo', '1024'),
      { recursive: true },
    ]);
    expect(fsModule.mkdir.mock.calls[1]).toEqual([
      path.join('images/output', 'photo', '800'),
      { recursive: true },
    ]);

    expect(sharpMock.mock.calls).toHaveLength(2);
    const instances = sharpMock.__mock.instances;
    expect(instances).toHaveLength(2);
    const firstResizeCall = instances[0].resize.mock.calls as Array<
      [{ width: number; withoutEnlargement: boolean }]
    >;
    const secondResizeCall = instances[1].resize.mock.calls as Array<
      [{ width: number; withoutEnlargement: boolean }]
    >;
    expect(firstResizeCall[0][0]).toEqual({
      width: 1024,
      withoutEnlargement: true,
    });
    expect(secondResizeCall[0][0]).toEqual({
      width: 800,
      withoutEnlargement: true,
    });

    const expectedOutputPaths = [
      path.join('images/output', 'photo', '1024', `${expectedMd5}.jpeg`),
      path.join('images/output', 'photo', '800', `${expectedMd5}.jpeg`),
    ];
    const firstToFileCall = instances[0].toFile.mock.calls as Array<[string]>;
    const secondToFileCall = instances[1].toFile.mock.calls as Array<[string]>;
    expect(firstToFileCall[0][0]).toBe(expectedOutputPaths[0]);
    expect(secondToFileCall[0][0]).toBe(expectedOutputPaths[1]);

    const publishCalls = eventBusMock.publish.mock.calls as Array<
      [ImageProcessedEvent | ImageProcessingFailed]
    >;
    expect(publishCalls).toHaveLength(1);
    const publishedEvent = publishCalls[0][0] as ImageProcessedEvent;
    expect(publishedEvent).toBeInstanceOf(ImageProcessedEvent);
    expect(publishedEvent.variants.map((variant) => variant.path.uri)).toEqual(
      expectedOutputPaths,
    );
  });

  it('handles local source paths when generating output locations', async () => {
    const { processor, eventBusMock, fileDownloaderMock } = buildProcessor();

    const task = createTask('/tmp/input.png');
    const buffer = Buffer.from('png-binary');
    const expectedMd5 = crypto.createHash('md5').update(buffer).digest('hex');
    fileDownloaderMock.download.mockResolvedValue(buffer);

    await processor.process(task);

    const outputDir = path.join('images/output', 'input', '1024');
    const mkdirCalls = fsModule.mkdir.mock.calls as Array<
      [string, { recursive: boolean }]
    >;
    expect(mkdirCalls[0][0]).toBe(outputDir);
    expect(mkdirCalls[0][1]).toEqual({ recursive: true });

    const publishCalls = eventBusMock.publish.mock.calls as Array<
      [ImageProcessedEvent | ImageProcessingFailed]
    >;
    const publishedEvent = publishCalls[0][0] as ImageProcessedEvent;
    expect(publishedEvent.variants[0].path.uri).toContain(`${expectedMd5}.png`);
  });

  it('publishes a failure event when processing throws', async () => {
    const { processor, eventBusMock, fileDownloaderMock } = buildProcessor();

    const task = createTask();
    fileDownloaderMock.download.mockRejectedValue(new Error('download failed'));

    await processor.process(task);

    const publishCalls = eventBusMock.publish.mock.calls as Array<
      [ImageProcessedEvent | ImageProcessingFailed]
    >;
    const failureEvent = publishCalls[0][0] as ImageProcessingFailed;
    expect(failureEvent).toBeInstanceOf(ImageProcessingFailed);
    expect(failureEvent.error).toContain('download failed');
  });

  it('loads the task from the repository when receiving TaskCreated events', async () => {
    const { subscriptions, taskRepoMock, fileDownloaderMock, eventBusMock } =
      buildProcessor();

    const handler = subscriptions[TaskCreatedQueue] as (
      event: TaskCreatedEvent,
    ) => Promise<void>;
    const task = createTask();
    const buffer = Buffer.from('image');

    taskRepoMock.findById.mockResolvedValue(task);
    fileDownloaderMock.download.mockResolvedValue(buffer);

    await handler(new TaskCreatedEvent(task.id, task.source.uri));

    expect(taskRepoMock.findById.mock.calls[0][0]).toBe('task-1');
    const publishArgs = eventBusMock.publish.mock.calls[0][0];
    expect(publishArgs).toBeInstanceOf(ImageProcessedEvent);
  });
});
