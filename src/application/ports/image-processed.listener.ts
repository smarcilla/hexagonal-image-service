export interface ImageProcessedListener {
  /**
   * Called when an image has been processed to update task state
   */
  onImageProcessed(taskId: string, variantCount: number): Promise<void>;
}
