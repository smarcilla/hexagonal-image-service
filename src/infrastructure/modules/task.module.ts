import { Module } from '@nestjs/common';
import { TaskController } from '../controllers/task.controller';
import { CreateImageProcessingTask } from '../../application/use-cases/create-image-processing-task.use-case';
import { GetImageProcessingTask } from '../../application/use-cases/get-image-processing-task.use-case';
import { InMemoryEventBus } from '../events/in-memory-event-bus';
import { SharpImageProcessor } from '../services/sharp-image.processor';
import { FileDownloaderService } from '../services/file-downloader.service';
import { TaskRepository } from 'src/application/ports/task.repository';
import { IdGenerator } from 'src/application/ports/id.generator';
import { EventBus } from 'src/application/ports/event.bus';
import { FileDownloader } from 'src/application/ports/file.downloader';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ImageProcessedListenerAdapter } from '../listeners/image-processed.listener';
import { MongoTaskRepository } from '../repositories/mongo-task.repository';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

@Module({
  imports: [ConfigModule],
  controllers: [TaskController],
  providers: [
    {
      provide: 'TaskRepository',
      useFactory: (connection: Connection) => {
        return new MongoTaskRepository(connection);
      },
      inject: [getConnectionToken()],
    },
    { provide: 'FileDownloader', useClass: FileDownloaderService },
    {
      provide: 'EventBus',
      useFactory: (config: ConfigService) => {
        const pollingInterval = config.get<number>(
          'EVENT_BUS_POLLING_INTERVAL_MS',
          InMemoryEventBus.DEFAULT_POLLING_INTERVAL_MS,
        );
        const autoStart = config.get<boolean>('EVENT_BUS_AUTO_START', true);
        return new InMemoryEventBus(pollingInterval, autoStart);
      },
      inject: [ConfigService],
    },
    // application services / use-cases
    {
      provide: CreateImageProcessingTask,
      useFactory: (
        repo: TaskRepository,
        idGen: IdGenerator,
        eventBus: EventBus,
      ) => new CreateImageProcessingTask(repo, idGen, eventBus),
      inject: ['TaskRepository', 'IdGenerator', 'EventBus'],
    },
    {
      provide: 'IdGenerator',
      useValue: { generate: () => Math.random().toString(36).slice(2, 9) },
    },
    // subscriber needs event bus instance; create after EventBus is available
    {
      provide: SharpImageProcessor,
      useFactory: (
        eventBus: EventBus,
        taskRepo: TaskRepository,
        fileDownloader: FileDownloader,
      ) => new SharpImageProcessor(eventBus, taskRepo, fileDownloader),
      inject: ['EventBus', 'TaskRepository', 'FileDownloader'],
    },
    {
      provide: ImageProcessedListenerAdapter,
      useFactory: (eventBus: EventBus, taskRepo: TaskRepository) =>
        new ImageProcessedListenerAdapter(eventBus, taskRepo),
      inject: ['EventBus', 'TaskRepository'],
    },
    {
      provide: GetImageProcessingTask,
      useFactory: (repo: TaskRepository) => new GetImageProcessingTask(repo),
      inject: ['TaskRepository'],
    },
  ],
  exports: [],
})
export class TaskModule {}
