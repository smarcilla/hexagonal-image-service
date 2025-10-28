import { DomainEvent } from '../../domain/events/domain-event';

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  // subscribe is part of adapter wiring; handlers will be implemented in application services and wired in infra
  // subscribe is optional and handlers may return void or Promise<void> depending on adapter
  subscribe?(eventType: string, handler: (event: DomainEvent) => unknown): void;
}
