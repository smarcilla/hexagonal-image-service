// TODO: Temporary subscriber that simulates image processing for tests.
// It listens for TaskCreated events and publishes ImageProcessed with
// mocked variant metadata. Replace with a real ImageProcessor adapter
// (Sharp + FS) when moving to a real environment.
import { EventBus } from '../../application/ports/event.bus';
import { TaskCreatedEvent } from '../../domain/events/task-created.event';
import { ImageProcessedEvent } from '../../domain/events/image-processed.event';
import { ImageProcessor } from '../../application/ports/image.processor';
import { TaskRepository } from 'src/application/ports/task.repository';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { ImageProcessingTask } from 'src/domain/entities/image-processing-task.model';
import { ImageVariant } from 'src/domain/entities/image-variant.model';
import { Resolution } from 'src/domain/value-objects/resolution.value';
import { Md5Hash } from 'src/domain/value-objects/md5hash.value';
import { ImageSource } from 'src/domain/value-objects/image-source.value';
import { Logger } from '@nestjs/common';

export class SharpImageProcessor implements ImageProcessor {
  private readonly logger = new Logger(SharpImageProcessor.name);
  constructor(
    private readonly eventBus: EventBus,
    private readonly taskRepo: TaskRepository,
  ) {
    // register handler: subscribe expects a handler returning Promise<void>.

    this.eventBus.subscribe('TaskCreated', async (ev: TaskCreatedEvent) => {
      // fire-and-forget: start processing but return a settled Promise so the subscriber signature is satisfied
      this.logger.log(`Processing task created event for task ${ev.taskId}`);
      await this.onTaskCreated(ev);
    });
  }
  async process(task: ImageProcessingTask): Promise<void> {
    //TODO: Refactor sharp processing logic
    try {
      const sourceUri = task.source.uri;
      const resolutions = [1024, 800]; //TODO: make configurable
      const imageName = path.parse(sourceUri).name;
      const ext = path.parse(sourceUri).ext.replace('.', '');

      const buffer = await fs.readFile(sourceUri);
      const md5 = crypto.createHash('md5').update(buffer).digest('hex');

      const variants: ImageVariant[] = [];

      for (const width of resolutions) {
        const outputDir = path.join(
          'images/output',
          imageName,
          width.toString(),
        );
        await fs.mkdir(outputDir, { recursive: true });
        const outputFile = path.join(outputDir, `${md5}.${ext}`);

        await sharp(buffer)
          .resize({ width, withoutEnlargement: true })
          .toFile(outputFile);

        const processedVariant = ImageVariant.create(
          Resolution.from(width),
          Md5Hash.from(md5),
          ImageSource.from(outputFile),
        );

        variants.push(processedVariant);
        task.addVariant(processedVariant);
      }

      await this.taskRepo.save(task);

      const event = new ImageProcessedEvent(task.id, variants);
      await this.eventBus.publish(event);
    } catch (err) {
      // Registrar el error con traza y contexto, luego volver a lanzar
      const message = `Error processing task ${task?.id ?? '<unknown>'}: ${String(
        (err as Error)?.message ?? err,
      )}`;
      this.logger.error(message, (err as Error)?.stack);
      throw err;
    }
  }

  async onTaskCreated(ev: TaskCreatedEvent): Promise<void> {
    const task = await this.taskRepo.findById(ev.taskId);

    this.logger.log(
      `Starting processing for task ${task.id} with source ${task.source.uri}`,
    );

    await this.process(task);

    this.logger.log(`Finished processing for task ${task.id}`);
  }
}
