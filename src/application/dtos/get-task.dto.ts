import { TaskStatus } from 'src/domain/entities/image-processing-task.model';
import { AllowedResolutions } from 'src/domain/value-objects/resolution.value';

export type GetTaskOutput = {
  taskId: string;
  status: TaskStatus;
  price: number;
  images: { resolution: AllowedResolutions; path: string }[];
};
