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
        await this.onImageProcessed(event);
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
}
