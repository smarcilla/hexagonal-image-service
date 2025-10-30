import { Logger } from '@nestjs/common';
import { EventBus } from '../../application/ports/event.bus';
import { TaskRepository } from '../../application/ports/task.repository';
import { ImageProcessedEvent } from '../../domain/events/image-processed.event';
import { ImageProcessedListener } from '../../application/ports/image-processed.listener';

export class ImageProcessedListenerAdapter implements ImageProcessedListener {
  private readonly logger = new Logger(ImageProcessedListenerAdapter.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly taskRepo: TaskRepository,
  ) {
    this.eventBus.subscribe(
      'ImageProcessed',
      async (event: ImageProcessedEvent) => {
        await this.onImageProcessed(event.taskId, event.variants.length);
      },
    );
  }

  async onImageProcessed(taskId: string, variantCount: number): Promise<void> {
    this.logger.log(
      `Handling ImageProcessed event for task ${taskId} with ${variantCount} variants`,
    );

    try {
      const task = await this.taskRepo.findById(taskId);

      // Add variants from event (they're already in the event)
      // The task should have been updated by SharpImageProcessor
      // We just need to mark it as completed
      task.complete();

      await this.taskRepo.save(task);

      this.logger.log(`Task ${taskId} marked as completed`);
    } catch (error) {
      this.logger.error(
        `Failed to complete task ${taskId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
