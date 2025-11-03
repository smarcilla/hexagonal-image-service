import { EventBus } from '../../application/ports/event.bus';
import { TaskCreatedEvent } from '../../domain/events/task-created.event';
import { ImageProcessedEvent } from '../../domain/events/image-processed.event';
import { ImageProcessor } from '../../application/ports/image.processor';
import { TaskRepository } from '../../application/ports/task.repository';
import { FileDownloader } from '../../application/ports/file.downloader';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { ImageProcessingTask } from '../../domain/entities/image-processing-task.model';
import { ImageVariant } from '../../domain/entities/image-variant.model';
import {
  AllowedResolutions,
  Resolution,
} from '../../domain/value-objects/resolution.value';
import { Md5Hash } from '../../domain/value-objects/md5hash.value';
import { ImageSource } from '../../domain/value-objects/image-source.value';
import { Logger } from '@nestjs/common';

/**
 * Infrastructure adapter that implements ImageProcessor port.
 * Uses Sharp for image processing and delegates file access to FileDownloader.
 * Supports both local files and remote URLs.
 */
export class SharpImageProcessor implements ImageProcessor {
  private readonly logger = new Logger(SharpImageProcessor.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly taskRepo: TaskRepository,
    private readonly fileDownloader: FileDownloader,
  ) {
    // Subscribe to TaskCreated events to trigger processing
    this.eventBus.subscribe('TaskCreated', async (ev: TaskCreatedEvent) => {
      this.logger.log(`Processing task created event for task ${ev.taskId}`);
      await this.onTaskCreated(ev);
    });
  }
  async process(task: ImageProcessingTask): Promise<void> {
    try {
      const sourceUri = task.source.uri;
      const resolutions: AllowedResolutions[] = ['1024', '800']; // TODO: make configurable

      // Extract original name and extension
      // For URLs, use the last path segment; for local paths, use the filename
      const imageName = this.extractImageName(sourceUri);
      const ext = this.extractExtension(sourceUri);

      // Delegate file download/read to FileDownloader (handles both local and remote)
      this.logger.log(`Downloading/reading image from: ${sourceUri}`);
      const buffer = await this.fileDownloader.download(sourceUri);

      const md5 = crypto.createHash('md5').update(buffer).digest('hex');

      const variants: ImageVariant[] = [];

      for (const width of resolutions) {
        const outputDir = path.join('images/output', imageName, width);
        await fs.mkdir(outputDir, { recursive: true });
        const outputFile = path.join(outputDir, `${md5}.${ext}`);

        await sharp(buffer)
          .resize({ width: Number(width), withoutEnlargement: true })
          .toFile(outputFile);

        const processedVariant = ImageVariant.create(
          Resolution.from(width),
          Md5Hash.from(md5),
          ImageSource.from(outputFile),
        );

        variants.push(processedVariant);
      }

      const event = new ImageProcessedEvent(task.id, variants);
      await this.eventBus.publish(event);
    } catch (err) {
      const message = `Error processing task ${task?.id ?? '<unknown>'}: ${String(
        (err as Error)?.message ?? err,
      )}`;
      this.logger.error(message, (err as Error)?.stack);
      throw err;
    }
  }

  private extractImageName(uri: string): string {
    try {
      // Try to parse as URL first
      const url = new URL(uri);
      const pathname = url.pathname;
      const lastSegment = pathname.split('/').filter(Boolean).pop() || 'image';
      return path.parse(lastSegment).name || 'image';
    } catch {
      // Not a URL, treat as local path
      return path.parse(uri).name || 'image';
    }
  }

  private extractExtension(uri: string): string {
    try {
      // Try to parse as URL first
      const url = new URL(uri);
      const pathname = url.pathname;
      const lastSegment = pathname.split('/').filter(Boolean).pop() || '';
      const ext = path.parse(lastSegment).ext.replace('.', '') || 'jpg';
      return ext;
    } catch {
      // Not a URL, treat as local path
      return path.parse(uri).ext.replace('.', '') || 'jpg';
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
