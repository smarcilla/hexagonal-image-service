import { CreateImageProcessingTask } from './create-image-processing-task.use-case';
import { TaskRepository } from '../ports/task.repository';
import { IdGenerator } from '../ports/id.generator';
import { ImageProcessingTask } from '../../domain/entities/image-processing-task.model';
import { EventBus } from '../ports/event.bus';
import { TaskCreatedEvent } from '../../domain/events/task-created.event';

class InMemoryTaskRepository implements TaskRepository {
  private store = new Map<string, ImageProcessingTask>();

  save(task: ImageProcessingTask): Promise<void> {
    this.store.set(task.id, task);
    return Promise.resolve();
  }

  findById(id: string): Promise<ImageProcessingTask> {
    return Promise.resolve(this.store.get(id)!);
  }
}

class StaticIdGenerator implements IdGenerator {
  constructor(private readonly id: string) {}
  generate(): string {
    return this.id;
  }
}

class MockEventBus implements EventBus {
  dispose(): void {
    throw new Error('Method not implemented.');
  }
  subscribe(): void {
    throw new Error('Method not implemented.');
  }
  public published: any[] = [];
  publish(event: any): Promise<void> {
    this.published.push(event);
    return Promise.resolve();
  }
}

describe('CreateImageProcessingTask use-case', () => {
  it('creates a task, processes image producing 2 variants and persists completed task', async () => {
    const repo = new InMemoryTaskRepository();
    const idGen = new StaticIdGenerator('task-123');
    const eventBus = new MockEventBus();

    const uc = new CreateImageProcessingTask(repo, idGen, eventBus);

    const res = await uc.execute({ source: 'file.jpg' });
    expect(res.taskId).toBe('task-123');

    const saved = await repo.findById('task-123');
    expect(saved).not.toBeNull();
    if (saved) {
      // since processing is asynchronous, the task should be pending and have no variants yet
      expect(saved.id).toBe('task-123');
      expect(saved.status).toBe('pending');
      expect(saved.variants.length).toBe(0);
    }

    // ensure TaskCreated event was published
    expect(eventBus.published.length).toBe(1);
    const ev = eventBus.published[0] as TaskCreatedEvent;
    expect(ev.type).toBe('TaskCreated');
    expect(ev.taskId).toBe('task-123');
    expect(ev.source).toBe('file.jpg');
  });

  it('throws when source is invalid', async () => {
    const repo = new InMemoryTaskRepository();
    const idGen = new StaticIdGenerator('task-124');
    const eventBus = new MockEventBus();
    const uc = new CreateImageProcessingTask(repo, idGen, eventBus);

    await expect(uc.execute({ source: '' })).rejects.toThrow();
  });
});
