/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/infrastructure/filters/domain-exception.filter';
import { CreateImageProcessingTask } from '../src/application/use-cases/create-image-processing-task.use-case';
import {
  CreateTaskInput,
  CreateTaskOutput,
} from '../src/application/dtos/create-task.dto';
import { InvalidImageSourceError } from '../src/domain/errors/invalid-image-source.error';

import { GetImageProcessingTask } from '../src/application/use-cases/get-image-processing-task.use-case';

import { TaskNotFoundError } from '../src/domain/errors/task-not-found.error';
import { getConnectionToken } from '@nestjs/mongoose';

const pendingTaskId = 'pendingtask123';
const completedTaskId = 'completedtask123';
const failedTaskId = 'failedtask123';
const invalidTaskId = 'nonexistent123';
const validCreateTaskInput: CreateTaskInput = {
  source: '/tmp/example.jpg',
};

const invalidCreateTaskInput: CreateTaskInput = {
  source: '',
};

const pendingValidCreateTaskOutput: CreateTaskOutput = {
  taskId: pendingTaskId,
  price: 25,
  status: 'pending',
};

const createTaskHttpError = {
  message: [
    'source should not be empty or blank',
    'source should not be empty',
  ],
  error: 'Bad Request',
  statusCode: 400,
};

const createTaskValidationError = {
  statusCode: 400,
  error: 'Bad Request',
  message: [
    'source should not be empty or blank',
    'source should not be empty',
    'source must be a string',
  ],
};

const createTaskBlankValidationError = {
  statusCode: 400,
  error: 'Bad Request',
  message: ['source should not be empty or blank'],
};

const getTaskInPendingStatus = {
  id: pendingTaskId,
  source: '/tmp/example.jpg',
  status: 'pending',
  price: 25,
  variants: [],
};

const getTaskInCompletedStatus = {
  id: completedTaskId,
  source: '/tmp/example.jpg',
  status: 'completed',
  price: 30,
  variants: [
    {
      resolution: '1024',
      path: '/output/completedtask123/1024/example_1024.jpg',
    },
    {
      resolution: '800',
      path: '/output/completedtask123/800/example_800.jpg',
    },
  ],
};

const getTaskInFailedStatus = {
  id: failedTaskId,
  source: '/non/existent/path/image.jpg',
  status: 'failed',
  price: 20,
  variants: [],
};

const mockCreateTask = {
  execute: async (input: CreateTaskInput): Promise<CreateTaskOutput> => {
    if (input.source === validCreateTaskInput.source) {
      return Promise.resolve(pendingValidCreateTaskOutput);
    } else {
      throw new InvalidImageSourceError('Invalid image source');
    }
  },
};

const mockGetTask = {
  execute: async (id: string) => {
    if (id === pendingTaskId) {
      return Promise.resolve(getTaskInPendingStatus);
    } else if (id === completedTaskId) {
      return Promise.resolve(getTaskInCompletedStatus);
    } else if (id === failedTaskId) {
      return Promise.resolve(getTaskInFailedStatus);
    } else {
      throw new TaskNotFoundError(id);
    }
  },
};

// Add mock TaskRepository
const mockTaskRepository = {
  save: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
};

// Mock Mongoose connection
const mockMongooseConnection = {
  model: jest.fn(),
  modelNames: jest.fn(() => []),
  close: jest.fn(),
};

describe('Tasks (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CreateImageProcessingTask)
      .useValue(mockCreateTask)
      .overrideProvider(GetImageProcessingTask)
      .useValue(mockGetTask)
      .overrideProvider('TaskRepository')
      .useValue(mockTaskRepository)
      .overrideProvider(getConnectionToken())
      .useValue(mockMongooseConnection)
      .compile();

    app = moduleFixture.createNestApplication();
    // register the domain exception filter (main.ts registers it in bootstrap for real app)
    app.useGlobalFilters(new DomainExceptionFilter());
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Scenario 1: Task created successfully', () => {
    it('POST /tasks - valid source returns id', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .send(validCreateTaskInput)
        .expect(201)
        .expect(pendingValidCreateTaskOutput);
    });
  });

  describe('Scenario 2: Bad Request validation errors', () => {
    it('POST /tasks - empty source returns 400 with validation error', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .send(invalidCreateTaskInput)
        .expect(400)
        .expect(createTaskHttpError);
    });

    it('POST /tasks - missing source returns 400 with validation error', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .send({})
        .expect(400)
        .expect(createTaskValidationError);
    });

    it('POST /tasks - whitespace source returns 400', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .send({ source: '   ' })
        .expect(400)
        .expect(createTaskBlankValidationError);
    });
  });

  describe('Scenario 3: Get task in pending status', () => {
    it('GET /tasks/:id - returns task with pending status immediately after creation', async () => {
      await request(app.getHttpServer())
        .get(`/tasks/${pendingTaskId}`)
        .expect(200)
        .expect(getTaskInPendingStatus);
    });
  });

  describe('Scenario 4: Get task in completed status', () => {
    it('GET /tasks/:id - returns task with completed status and 2 variants', async () => {
      // Retrieve task
      await request(app.getHttpServer())
        .get(`/tasks/${completedTaskId}`)
        .expect(200)
        .expect(getTaskInCompletedStatus);
    });
  });

  describe('Scenario 5: Get task in failed status', () => {
    it('GET /tasks/:id - returns task with failed status for error processing image', async () => {
      await request(app.getHttpServer())
        .get(`/tasks/${failedTaskId}`)
        .expect(200)
        .expect(getTaskInFailedStatus);
    });

    it('GET /tasks/:id - returns 404 for non-existent task', async () => {
      await request(app.getHttpServer())
        .get(`/tasks/${invalidTaskId}`)
        .expect(404);
    });
  });
});
