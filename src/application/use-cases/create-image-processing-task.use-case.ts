import { TaskRepository } from '../ports/task.repository';
import { IdGenerator } from '../ports/id.generator';
import { EventBus } from '../ports/event.bus';
import { TaskCreatedEvent } from '../../domain/events/task-created.event';
import { ImageSource } from '../../domain/value-objects/image-source.value';
import { ImageProcessingTask } from '../../domain/entities/image-processing-task.model';

export type CreateTaskInput = {
  source: string;
};

export class CreateImageProcessingTask {
  constructor(
    private readonly taskRepo: TaskRepository,
    private readonly idGen: IdGenerator,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: CreateTaskInput): Promise<{ id: string }> {
    // validation delegated to value objects
    const source = ImageSource.from(input.source);
    const id = this.idGen.generate();
    const task = new ImageProcessingTask(id, source);

    // Persist initial pending task so it exists for downstream processors
    await this.taskRepo.save(task);

    // Publish TaskCreated event and return immediately. Image processing will be handled asynchronously by subscribers.
    // originalName (derived from the source) will be computed by the subscriber/processor, not by the use-case.
    await this.eventBus.publish(new TaskCreatedEvent(id, source.uri));

    return { id };
  }
}
