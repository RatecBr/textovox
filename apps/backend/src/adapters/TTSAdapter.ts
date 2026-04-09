import { Readable } from 'stream';

export interface TTSPreviewResult {
  stream: Readable;
  contentType: string;
}

export interface TTSRenderResult {
  buffer: Buffer;
  contentType: string;
}

export interface TTSAdapter {
  preview(input: string, options?: any): Promise<TTSPreviewResult>;
  render(input: string, options?: any): Promise<TTSRenderResult>;
}
