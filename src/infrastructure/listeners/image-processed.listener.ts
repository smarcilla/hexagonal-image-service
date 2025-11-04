import { Logger } from '@nestjs/common';
import {
  EventBus,
  ImageProcessedQueue,
  ImageProcessingFailedQueue,
} from '../../application/ports/event.bus';
import { TaskRepository } from '../../application/ports/task.repository';
import { ImageProcessedEvent } from '../../domain/events/image-processed.event';
import { ImageProcessedListener } from '../../application/ports/image-processed.listener';
import { ImageProcessingFailed } from '../../domain/events/image-processing-failed.event';

export class ImageProcessedListenerAdapter implements ImageProcessedListener {
  private readonly logger = new Logger(ImageProcessedListenerAdapter.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly taskRepo: TaskRepository,
  ) {
    this.eventBus.subscribe(
      ImageProcessedQueue,
      async (event: ImageProcessedEvent) => {
        await this.onImageProcessed(event);
      },
    );

    this.eventBus.subscribe(
      ImageProcessingFailedQueue,
      async (event: ImageProcessingFailed) => {
        await this.handleImageProcessingFailed(event);
      },
    );
  }

  async onImageProcessed(event: ImageProcessedEvent): Promise<void> {
    const { taskId, variants } = event;
    this.logger.log(
      `Handling ImageProcessed event for task ${taskId} with ${variants.length} variants`,
    );

    try {
      const task = await this.taskRepo.findById(taskId);

      this.logger.log(`Loaded task ${taskId} for completion`);

      for (const variant of variants) {
        task.addVariant(variant);
      }

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

  private async handleImageProcessingFailed(
    event: ImageProcessingFailed,
  ): Promise<void> {
    const task = await this.taskRepo.findById(event.taskId);

    if (!task) {
      this.logger.error(`Task ${event.taskId} not found for failure handling`);
      return;
    }

    task.fail();
    this.logger.warn(
      `Marking task ${event.taskId} as failed due to error: ${event.error}`,
    );
    await this.taskRepo.save(task);
  }
}
