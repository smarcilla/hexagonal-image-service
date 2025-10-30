import { ImageProcessedEvent } from '../../domain/events/image-processed.event';
import { TaskRepository } from '../ports/task.repository';
import { DomainError } from '../../domain/errors/domain.error';

/**
 * Handles ImageProcessed events: loads the task, adds variants and completes the task.
 * This class is part of the application layer. Actual subscription wiring to the EventBus
 * should be done in the infrastructure layer (adapters).
 */
export class ImageProcessedHandler {
  constructor(private readonly taskRepo: TaskRepository) {}

  async handle(event: ImageProcessedEvent): Promise<void> {
    const task = await this.taskRepo.findById(event.taskId);
    if (!task) {
      // In a real system we might log and retry; for now throw
      throw new DomainError(
        `Task ${event.taskId} not found when handling ImageProcessed`,
      );
    }

    for (const variant of event.variants) {
      task.addVariant(variant);
    }

    task.complete();

    await this.taskRepo.save(task);
  }
}
