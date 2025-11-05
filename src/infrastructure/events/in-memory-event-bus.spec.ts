import { InMemoryEventBus } from './in-memory-event-bus';
import { DomainEvent } from '../../domain/events/domain-event';

describe('InMemoryEventBus (infrastructure)', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('dispatches queued events to subscribed handlers when started', async () => {
    jest.useFakeTimers();

    const bus = new InMemoryEventBus(10, false);
    const handler = jest.fn<Promise<void>, [DomainEvent]>();
    const event: DomainEvent = { type: 'TaskCreated', occurredAt: new Date() };

    bus.subscribe('TaskCreated', handler);
    await bus.publish(event);
    bus.start();

    jest.advanceTimersByTime(10);
    await Promise.resolve();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);

    bus.dispose();
  });

  it('continues processing handlers even if one of them throws', async () => {
    jest.useFakeTimers();

    const bus = new InMemoryEventBus(5, false);
    const failingHandler = jest
      .fn<Promise<void>, [DomainEvent]>()
      .mockRejectedValue(new Error('boom'));
    const succeedingHandler = jest
      .fn<Promise<void>, [DomainEvent]>()
      .mockResolvedValue();
    const event: DomainEvent = {
      type: 'ImageProcessed',
      occurredAt: new Date(),
    };

    bus.subscribe('ImageProcessed', failingHandler);
    bus.subscribe('ImageProcessed', succeedingHandler);

    await bus.publish(event);
    bus.start();

    jest.advanceTimersByTime(5);
    await Promise.resolve();

    expect(failingHandler).toHaveBeenCalledTimes(1);
    expect(succeedingHandler).toHaveBeenCalledTimes(1);

    bus.dispose();
  });
});
