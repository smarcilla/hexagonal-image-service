import { Connection } from 'mongoose';
import { MongoTaskRepository } from './mongo-task.repository';
import { ImageProcessingTask } from '../../domain/entities/image-processing-task.model';
import { ImageSource } from '../../domain/value-objects/image-source.value';
import { Money } from '../../domain/value-objects/money.value';
import { Resolution } from '../../domain/value-objects/resolution.value';
import { Md5Hash } from '../../domain/value-objects/md5hash.value';
import { ImageVariant } from '../../domain/entities/image-variant.model';
import { TaskNotFoundError } from '../../domain/errors/task-not-found.error';

const createConnectionMock = (
  tasksOverrides: Record<string, jest.Mock> = {},
  imagesOverrides: Record<string, jest.Mock> = {},
) => {
  const tasksCollection = {
    findOne: jest.fn(),
    replaceOne: jest.fn(),
    ...tasksOverrides,
  } as Record<string, jest.Mock>;

  const imagesCollection = {
    bulkWrite: jest.fn(),
    find: jest.fn(),
    ...imagesOverrides,
  } as Record<string, jest.Mock>;

  const collection = jest
    .fn()
    .mockReturnValueOnce(tasksCollection)
    .mockReturnValueOnce(imagesCollection);

  const connection = {
    db: {
      collection,
    },
  } as unknown as Connection;

  return { connection, tasksCollection, imagesCollection, collection };
};

describe('MongoTaskRepository (infrastructure)', () => {
  const buildCompletedTask = () => {
    const source = ImageSource.from('input.png');
    const task = ImageProcessingTask.create('task-1', source, Money.from(42));
    const variantHd = ImageVariant.create(
      Resolution.from('1024'),
      Md5Hash.from('a'.repeat(32)),
      ImageSource.from('output-1024.png'),
    );
    const variantWeb = ImageVariant.create(
      Resolution.from('800'),
      Md5Hash.from('b'.repeat(32)),
      ImageSource.from('output-800.png'),
    );
    task.addVariant(variantHd);
    task.addVariant(variantWeb);
    task.complete();
    return { task, variantHd, variantWeb };
  };

  it('throws if connection does not expose a database', () => {
    const invalidConnection = {} as Connection;
    expect(() => new MongoTaskRepository(invalidConnection)).toThrow(
      'MongoDB connection not established',
    );
  });

  it('saves a task and its variants to both collections', async () => {
    const { connection, tasksCollection, imagesCollection } =
      createConnectionMock();

    tasksCollection.findOne.mockResolvedValue(null);
    tasksCollection.replaceOne.mockResolvedValue(undefined);
    imagesCollection.bulkWrite.mockResolvedValue(undefined);

    const repo = new MongoTaskRepository(connection);
    const { task } = buildCompletedTask();

    await repo.save(task);

    expect(tasksCollection.findOne).toHaveBeenCalledWith({ _id: 'task-1' });

    type CapturedTaskDocument = {
      _id: string;
      status: string;
      price: number;
      createdAt: Date;
      updatedAt: Date;
      originalPath: string;
      images: Array<{ resolution: string; path: string; md5: string }>;
    };

    const replaceArgs = tasksCollection.replaceOne.mock.calls[0] as [
      { _id: string },
      CapturedTaskDocument,
      { upsert: boolean },
    ];
    const savedDoc = replaceArgs[1];
    expect(savedDoc).toMatchObject({
      _id: 'task-1',
      status: 'completed',
      price: 42,
      originalPath: 'input.png',
      images: [
        {
          resolution: '1024',
          path: 'output-1024.png',
          md5: 'a'.repeat(32),
        },
        {
          resolution: '800',
          path: 'output-800.png',
          md5: 'b'.repeat(32),
        },
      ],
    });
    expect(savedDoc.createdAt).toBeInstanceOf(Date);
    expect(savedDoc.updatedAt).toBeInstanceOf(Date);

    expect(imagesCollection.bulkWrite).toHaveBeenCalledTimes(1);
    type BulkOperation = {
      replaceOne: { filter: { _id: string }; upsert: boolean };
    };

    const [operations] = imagesCollection.bulkWrite.mock.calls[0] as [
      BulkOperation[],
    ];
    expect(operations).toHaveLength(2);
    expect(operations[0].replaceOne).toMatchObject({
      filter: { _id: 'task-1_1024' },
      upsert: true,
    });
    expect(operations[1].replaceOne).toMatchObject({
      filter: { _id: 'task-1_800' },
      upsert: true,
    });
  });

  it('reconstructs a domain model when a task is found', async () => {
    const { connection, tasksCollection, imagesCollection } =
      createConnectionMock();

    const taskDoc = {
      _id: 'task-1',
      status: 'completed',
      price: 42,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z'),
      originalPath: 'input.png',
      images: [
        { resolution: '1024', path: 'output-1024.png', md5: 'a'.repeat(32) },
        { resolution: '800', path: 'output-800.png', md5: 'b'.repeat(32) },
      ],
    };

    const imageDocs = [
      {
        _id: 'task-1_1024',
        taskId: 'task-1',
        resolution: '1024' as const,
        path: 'output-1024.png',
        md5: 'a'.repeat(32),
        timestamp: new Date('2024-01-02T00:00:00Z'),
      },
      {
        _id: 'task-1_800',
        taskId: 'task-1',
        resolution: '800' as const,
        path: 'output-800.png',
        md5: 'b'.repeat(32),
        timestamp: new Date('2024-01-02T00:00:00Z'),
      },
    ];

    tasksCollection.findOne.mockResolvedValue(taskDoc);
    imagesCollection.find.mockReturnValue({
      toArray: jest.fn().mockResolvedValue(imageDocs),
    });

    const repo = new MongoTaskRepository(connection);

    const task = await repo.findById('task-1');

    expect(task.id).toBe('task-1');
    expect(task.status).toBe('completed');
    expect(task.price.amount).toBe(42);
    expect(task.variants).toHaveLength(2);
    expect(task.variants[0].path.uri).toBe('output-1024.png');
  });

  it('throws TaskNotFoundError when the task is missing', async () => {
    const { connection, tasksCollection, imagesCollection } =
      createConnectionMock();

    tasksCollection.findOne.mockResolvedValue(null);
    imagesCollection.find.mockReturnValue({
      toArray: jest.fn().mockResolvedValue([]),
    });

    const repo = new MongoTaskRepository(connection);

    await expect(repo.findById('missing')).rejects.toBeInstanceOf(
      TaskNotFoundError,
    );
  });
});
