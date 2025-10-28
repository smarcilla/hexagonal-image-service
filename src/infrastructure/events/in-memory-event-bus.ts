import { DomainEvent } from 'src/domain/events/domain-event';
import { EventBus } from '../../application/ports/event.bus';

type Handler = (event: DomainEvent) => Promise<void>;

export class InMemoryEventBus implements EventBus {
  private handlers: Map<string, Handler[]> = new Map();

  publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) ?? [];
    // call handlers asynchronously but don't await them here (fire-and-forget semantics)
    for (const h of handlers) {
      // schedule microtask and explicitly ignore the returned promise
      void Promise.resolve().then(() => h(event).catch(() => undefined));
    }
    return Promise.resolve();
  }

  subscribe(eventType: string, handler: Handler): void {
    const list = this.handlers.get(eventType) ?? [];
    list.push(handler);
    this.handlers.set(eventType, list);
  }
}
