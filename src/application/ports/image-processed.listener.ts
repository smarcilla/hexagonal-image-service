import { ImageProcessedEvent } from 'src/domain/events/image-processed.event';

export interface ImageProcessedListener {
  /**
   * Called when an image has been processed to update task state
   */
  onImageProcessed(event: ImageProcessedEvent): Promise<void>;
}
