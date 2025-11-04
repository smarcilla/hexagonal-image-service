import { TaskStatus } from 'src/domain/entities/image-processing-task.model';

export type GetTaskOutput = {
  status: TaskStatus;
  price: number;
  paths?: string[];
};
