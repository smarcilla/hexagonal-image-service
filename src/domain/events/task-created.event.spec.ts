import { TaskCreatedEvent } from './task-created.event';

describe('TaskCreatedEvent (domain)', () => {
  it('captures task information and timestamp', () => {
    const event = new TaskCreatedEvent('task-123', 'source.png');

    expect(event.type).toBe('TaskCreated');
    expect(event.taskId).toBe('task-123');
    expect(event.source).toBe('source.png');
    expect(event.occurredAt).toBeInstanceOf(Date);
    expect(Number.isNaN(event.occurredAt.getTime())).toBe(false);
  });
});
