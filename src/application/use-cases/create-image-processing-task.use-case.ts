import { TaskRepository } from '../ports/task.repository';
import { IdGenerator } from '../ports/id.generator';
import { EventBus } from '../ports/event.bus';
import { TaskCreatedEvent } from '../../domain/events/task-created.event';
import { ImageSource } from '../../domain/value-objects/image-source.value';
import { ImageProcessingTask } from '../../domain/entities/image-processing-task.model';
import type {
  CreateTaskInput,
  CreateTaskOutput,
} from '../dtos/create-task.dto';

export class CreateImageProcessingTask {
  constructor(
    private readonly taskRepo: TaskRepository,
    private readonly idGen: IdGenerator,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: CreateTaskInput): Promise<CreateTaskOutput> {
    // validation delegated to value objects
    const source = ImageSource.from(input.source);
    const id = this.idGen.generate();
    const task = ImageProcessingTask.create(id, source);

    await this.taskRepo.save(task);

    await this.eventBus.publish(new TaskCreatedEvent(id, source.uri));

    return { taskId: task.id, price: task.price.amount, status: task.status };
  }
}
