import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Collection } from 'mongodb';
import { TaskRepository } from '../../application/ports/task.repository';
import {
  ImageProcessingTask,
  TaskStatus,
} from '../../domain/entities/image-processing-task.model';
import { ImageSource } from '../../domain/value-objects/image-source.value';
import { Money } from '../../domain/value-objects/money.value';
import {
  AllowedResolutions,
  Resolution,
} from '../../domain/value-objects/resolution.value';
import { Md5Hash } from '../../domain/value-objects/md5hash.value';
import { ImageVariant } from '../../domain/entities/image-variant.model';
import { TaskNotFoundError } from '../../domain/errors/task-not-found.error';

interface ImageDocument {
  _id: string;
  taskId: string;
  resolution: AllowedResolutions;
  path: string;
  md5: string;
  timestamp: Date;
}

interface TaskDocument {
  _id: string;
  status: TaskStatus;
  price: number;
  createdAt: Date;
  updatedAt: Date;
  originalPath: string;
  images: Array<{
    resolution: AllowedResolutions;
    path: string;
    md5: string;
  }>;
}

/**
 * MongoDB implementation of TaskRepository.
 * Stores tasks in 'tasks' collection and image variants in 'images' collection.
 * Uses embedded documents in tasks for quick access and separate collection for querying.
 */
@Injectable()
export class MongoTaskRepository implements TaskRepository {
  private readonly logger = new Logger(MongoTaskRepository.name);
  private readonly tasksCollection: Collection<TaskDocument>;
  private readonly imagesCollection: Collection<ImageDocument>;

  constructor(@InjectConnection() private readonly connection: Connection) {
    this.validateConnection();
    this.tasksCollection =
      this.connection.db!.collection<TaskDocument>('tasks');
    this.imagesCollection =
      this.connection.db!.collection<ImageDocument>('images');
  }

  /**
   * Validates that MongoDB connection is properly established
   * @throws Error if connection is not ready
   */
  private validateConnection(): void {
    if (!this.connection?.db) {
      throw new Error('MongoDB connection not established');
    }
  }

  /**
   * Saves or updates a task and its variants atomically.
   * Updates both the tasks collection (with embedded images) and separate images collection.
   */
  async save(task: ImageProcessingTask): Promise<void> {
    try {
      const now = new Date();
      const existingTask = await this.tasksCollection.findOne({ _id: task.id });

      const taskDocument = this.toTaskDocument(
        task,
        existingTask?.createdAt ?? now,
        now,
      );
      const imageDocuments = this.toImageDocuments(task, now);

      // Save task document
      await this.tasksCollection.replaceOne({ _id: task.id }, taskDocument, {
        upsert: true,
      });

      // Save image documents if variants exist
      if (imageDocuments.length > 0) {
        await this.saveImageDocuments(imageDocuments);
      }

      this.logger.log(
        `Task ${task.id} saved successfully with ${imageDocuments.length} variants`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to save task ${task.id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new Error(`Failed to save task: ${(error as Error).message}`);
    }
  }

  /**
   * Finds a task by ID and reconstructs its domain model with all variants.
   * @throws Error if task is not found
   */
  async findById(id: string): Promise<ImageProcessingTask> {
    const taskDoc = await this.tasksCollection.findOne({ _id: id });
    if (!taskDoc) {
      this.logger.warn(`Task ${id} not found in database`);
      throw new TaskNotFoundError(id);
    }

    // For completed tasks, fetch full image documents with MD5 hashes
    let fullImages: ImageDocument[] = [];
    if (taskDoc.images.length > 0) {
      fullImages = await this.imagesCollection.find({ taskId: id }).toArray();
    }

    const task = this.toDomainModel(taskDoc, fullImages);
    this.logger.debug(`Task ${id} retrieved with status: ${task.status}`);

    return task;
  }

  /**
   * Converts domain task to MongoDB task document
   */
  private toTaskDocument(
    task: ImageProcessingTask,
    createdAt: Date,
    updatedAt: Date,
  ): TaskDocument {
    return {
      _id: task.id,
      status: task.status,
      price: task.price.amount,
      createdAt,
      updatedAt,
      originalPath: task.source.uri,
      images: task.variants.map((variant) => ({
        resolution: variant.resolution.width,
        path: variant.path.uri,
        md5: variant.md5.value,
      })),
    };
  }

  /**
   * Converts domain task variants to MongoDB image documents
   */
  private toImageDocuments(
    task: ImageProcessingTask,
    timestamp: Date,
  ): ImageDocument[] {
    return task.variants.map((variant) => ({
      _id: this.generateImageId(task.id, variant.resolution.width),
      taskId: task.id,
      resolution: variant.resolution.width,
      path: variant.path.uri,
      md5: variant.md5.value,
      timestamp,
    }));
  }

  /**
   * Generates a deterministic image document ID
   */
  private generateImageId(
    taskId: string,
    resolution: AllowedResolutions,
  ): string {
    return `${taskId}_${resolution}`;
  }

  /**
   * Bulk saves image documents using replaceOne with upsert
   */
  private async saveImageDocuments(
    imageDocuments: ImageDocument[],
  ): Promise<void> {
    const bulkOps = imageDocuments.map((img) => ({
      replaceOne: {
        filter: { _id: img._id },
        replacement: img,
        upsert: true,
      },
    }));

    await this.imagesCollection.bulkWrite(bulkOps);
  }

  /**
   * Reconstructs domain model from MongoDB documents
   */
  private toDomainModel(
    doc: TaskDocument,
    fullImages: ImageDocument[],
  ): ImageProcessingTask {
    const source = ImageSource.from(doc.originalPath);
    const price = Money.from(doc.price);

    // Only reconstruct variants if we have full image documents (completed tasks)
    const variants =
      fullImages.length > 0 ? fullImages.map((img) => this.toVariant(img)) : [];

    return ImageProcessingTask.create(
      doc._id,
      source,
      price,
      doc.status,
      variants,
    );
  }

  /**
   * Converts image document to domain variant
   */
  private toVariant(img: ImageDocument): ImageVariant {
    const resolution = Resolution.from(img.resolution);
    const path = ImageSource.from(img.path);
    const md5 = Md5Hash.from(img.md5);

    return ImageVariant.create(resolution, md5, path);
  }
}
