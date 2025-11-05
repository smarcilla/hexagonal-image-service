import { ImageProcessingFailed } from './image-processing-failed.event';

describe('ImageProcessingFailed (domain)', () => {
  it('captures the failure details and event metadata', () => {
    const event = new ImageProcessingFailed('task-123', 'Unexpected error');

    expect(event.type).toBe('ImageProcessingFailed');
    expect(event.taskId).toBe('task-123');
    expect(event.error).toBe('Unexpected error');
    expect(event.occurredAt).toBeInstanceOf(Date);
  });
});
