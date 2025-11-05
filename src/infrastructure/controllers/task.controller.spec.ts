import { CreateImageProcessingTask } from 'src/application/use-cases/create-image-processing-task.use-case';
import { TaskController } from './task.controller';
import { GetImageProcessingTask } from 'src/application/use-cases/get-image-processing-task.use-case';

const mockCreateTask = () => ({
  execute: jest.fn(),
});

const mockGetTask = () => ({
  execute: jest.fn(),
});

describe('TaskController (infrastructure)', () => {
  it('delegates task creation to the use case', async () => {
    const createTask = mockCreateTask();
    const getTask = mockGetTask();
    createTask.execute.mockResolvedValue({
      taskId: 'task-1',
      price: 10,
      status: 'pending',
    });

    const controller = new TaskController(
      createTask as unknown as CreateImageProcessingTask,
      getTask as unknown as GetImageProcessingTask,
    );

    const result = await controller.create({ source: 'file.jpg' });

    expect(createTask.execute).toHaveBeenCalledWith({ source: 'file.jpg' });
    expect(result).toEqual({ taskId: 'task-1', price: 10, status: 'pending' });
  });

  it('retrieves task information through the query use case', async () => {
    const createTask = mockCreateTask();
    const getTask = mockGetTask();
    getTask.execute.mockResolvedValue({
      status: 'completed',
      price: 42,
      paths: [],
    });

    const controller = new TaskController(
      createTask as unknown as CreateImageProcessingTask,
      getTask as unknown as GetImageProcessingTask,
    );

    const result = await controller.getTask('task-1');

    expect(getTask.execute).toHaveBeenCalledWith('task-1');
    expect(result).toEqual({ status: 'completed', price: 42, paths: [] });
  });
});
