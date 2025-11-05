import { FileDownloaderService } from './file-downloader.service';
import fs from 'fs/promises';

jest.mock('fs/promises', () => ({
  __esModule: true,
  default: {
    readFile: jest.fn(),
  },
}));

describe('FileDownloaderService (infrastructure)', () => {
  const fileDownloader = () => new FileDownloaderService();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('downloads remote files via fetch', async () => {
    const arrayBuffer = new ArrayBuffer(3);
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      arrayBuffer: jest.fn().mockResolvedValue(arrayBuffer),
    } as unknown as Response);

    const service = fileDownloader();
    const buffer = await service.download('https://example.com/image.jpg');

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/image.jpg');
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.byteLength).toBe(3);
  });

  it('throws when remote download fails', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as unknown as Response);

    const service = fileDownloader();

    await expect(
      service.download('https://example.com/image.jpg'),
    ).rejects.toThrow(
      /Error downloading file from https:\/\/example.com\/image.jpg: Failed to download image from https:\/\/example.com\/image.jpg: 500 Internal Server Error/,
    );
  });

  it('reads files from local disk', async () => {
    const readFileMock = (fs.readFile as jest.Mock).mockResolvedValue(
      Buffer.from('abc'),
    );

    const service = fileDownloader();

    const buffer = await service.download('/tmp/image.png');

    expect(readFileMock).toHaveBeenCalledWith('/tmp/image.png');
    expect(buffer.equals(Buffer.from('abc'))).toBe(true);
  });

  it('wraps read errors for local files', async () => {
    (fs.readFile as jest.Mock).mockRejectedValue(new Error('boom'));

    const service = fileDownloader();

    await expect(service.download('/tmp/missing.png')).rejects.toThrow(
      'Error reading local file /tmp/missing.png: boom',
    );
  });
});
