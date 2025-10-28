/* eslint-disable @typescript-eslint/no-misused-promises */
// TODO: Temporary subscriber that simulates image processing for tests.
// It listens for TaskCreated events and publishes ImageProcessed with
// mocked variant metadata. Replace with a real ImageProcessor adapter
// (Sharp + FS) when moving to a real environment.
import { EventBus } from '../../application/ports/event.bus';
import { TaskCreatedEvent } from '../../domain/events/task-created.event';
import { ImageProcessedEvent } from '../../domain/events/image-processed.event';

function fakeMd5(seed: string) {
  // deterministic mock md5 (not real md5) for demo/testing
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16).padStart(32, '0').slice(0, 32);
}

export class TaskCreatedSubscriber {
  constructor(private readonly eventBus: EventBus) {
    // register handler: subscribe expects a handler returning Promise<void>.

    this.eventBus.subscribe?.('TaskCreated', (ev: TaskCreatedEvent) => {
      // fire-and-forget: start processing but return a settled Promise so the subscriber signature is satisfied
      void this.onTaskCreated(ev);
      return Promise.resolve();
    });
  }

  onTaskCreated(ev: TaskCreatedEvent): Promise<void> {
    // simulate async processing by returning a Promise that resolves once the simulated processing completes
    return new Promise((resolve) => {
      setTimeout(async () => {
        const resolutions = [1024, 800];
        const variants = resolutions.map((r) => {
          const md5 = fakeMd5(ev.taskId + '|' + r);
          const ext = (ev.source || '').split('.').pop() || 'jpg';
          const outputPath = `/output/${(ev.source || '').split('/').pop() ?? ev.taskId}/${r}/${md5}.${ext}`;
          return { resolution: r, md5, ext, outputPath };
        });

        await this.eventBus.publish(
          new ImageProcessedEvent(ev.taskId, variants),
        );
        resolve();
      }, 0);
    });
  }
}
