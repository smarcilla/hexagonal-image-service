import { DomainEvent } from '../../domain/events/domain-event';

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;

  subscribe(eventType: string, handler: (event: DomainEvent) => unknown): void;
}
