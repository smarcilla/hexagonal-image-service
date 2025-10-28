import { TaskRepository } from '../../application/ports/task.repository';
import { ImageProcessingTask } from '../../domain/entities/image-processing-task.model';

export class InMemoryTaskRepository implements TaskRepository {
  private store = new Map<string, ImageProcessingTask>();

  save(task: ImageProcessingTask): Promise<void> {
    this.store.set(task.id, task);
    return Promise.resolve();
  }

  findById(id: string): Promise<ImageProcessingTask | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }
}
