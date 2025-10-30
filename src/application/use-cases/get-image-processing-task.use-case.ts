import type { TaskRepository } from '../ports/task.repository';

export class GetImageProcessingTask {
  constructor(private readonly taskRepo: TaskRepository) {}

  async execute(id: string) {
    const task = await this.taskRepo.findById(id);
    if (!task) return null;

    return {
      status: task.status,
      price: { amount: task.price.amount },
    };
  }
}
