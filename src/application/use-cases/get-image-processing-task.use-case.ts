import type { TaskRepository } from '../ports/task.repository';

export class GetImageProcessingTask {
  constructor(private readonly taskRepo: TaskRepository) {}

  async execute(id: string) {
    const task = await this.taskRepo.findById(id);
    if (!task) return null;

    return {
      id: task.id,
      status: task.status,
      price: { amount: task.price.amount },
      source: task.source.uri,
      variants: task.variants.map((v) => ({
        resolution: v.resolution.width,
        md5: v.md5.value,
        ext: v.ext,
      })),
    };
  }
}
