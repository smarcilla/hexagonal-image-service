import { ImageProcessingTask } from '../../domain/entities/image-processing-task.model';

export interface TaskRepository {
  save(task: ImageProcessingTask): Promise<void>;
  findById(id: string): Promise<ImageProcessingTask>;
}
