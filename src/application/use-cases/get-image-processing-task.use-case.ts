import { TaskRepository } from '../ports/task.repository';

import { GetTaskOutput } from '../dtos/get-task.dto';

export class GetImageProcessingTask {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(taskId: string): Promise<GetTaskOutput> {
    const task = await this.taskRepository.findById(taskId);

    return {
      status: task.status,
      price: task.price.amount,
      paths: task.variants.map((variant) => variant.path.uri),
    };
  }
}
