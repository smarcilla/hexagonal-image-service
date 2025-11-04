import { DomainEvent } from '../../domain/events/domain-event';

export const TaskCreatedQueue = 'TaskCreated';
export const ImageProcessedQueue = 'ImageProcessed';
export const ImageProcessingFailedQueue = 'ImageProcessingFailed';

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;

  subscribe(eventType: string, handler: (event: DomainEvent) => unknown): void;

  /**
   * Detiene el bus de eventos y libera recursos.
   */
  dispose(): void;
}
