/**
 * Port for downloading/reading file data from various sources.
 * Abstracts the complexity of handling local files vs remote URLs.
 */
export interface FileDownloader {
  /**
   * Downloads or reads a file from a given source URI.
   * @param uri - Can be a local file path or a remote URL
   * @returns Promise resolving to the file content as a Buffer
   * @throws Error if the file cannot be accessed or downloaded
   */
  download(uri: string): Promise<Buffer>;
}
