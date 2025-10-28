export type ProcessedVariant = {
  resolution: number;
  md5: string;
  ext: string;
  outputPath: string;
};

export interface ImageProcessor {
  /**
   * Process the source image and produce variants.
   * @param sourceUri local path or URL
   * @param originalName original filename (used for output path)
   * @param taskId id of the processing task
   */
  process(
    sourceUri: string,
    originalName: string,
    taskId: string,
  ): Promise<ProcessedVariant[]>;
}
