import { Injectable, Logger } from '@nestjs/common';
import { FileDownloader } from '../../application/ports/file.downloader';
import fs from 'fs/promises';

/**
 * Infrastructure adapter that implements FileDownloader port.
 * Handles both local file system paths and remote HTTP(S) URLs.
 */
@Injectable()
export class FileDownloaderService implements FileDownloader {
  private readonly logger = new Logger(FileDownloaderService.name);

  async download(uri: string): Promise<Buffer> {
    if (this.isUrl(uri)) {
      return this.downloadFromUrl(uri);
    } else {
      return this.readFromLocalPath(uri);
    }
  }

  private isUrl(uri: string): boolean {
    try {
      const url = new URL(uri);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private async downloadFromUrl(url: string): Promise<Buffer> {
    this.logger.log(`Downloading image from URL: ${url}`);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Failed to download image from ${url}: ${response.status} ${response.statusText}`,
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      const message = `Error downloading file from ${url}: ${(error as Error).message}`;
      this.logger.error(message, (error as Error).stack);
      throw new Error(message);
    }
  }

  private async readFromLocalPath(filePath: string): Promise<Buffer> {
    this.logger.log(`Reading image from local path: ${filePath}`);

    try {
      return await fs.readFile(filePath);
    } catch (error) {
      const message = `Error reading local file ${filePath}: ${(error as Error).message}`;
      this.logger.error(message, (error as Error).stack);
      throw new Error(message);
    }
  }
}
