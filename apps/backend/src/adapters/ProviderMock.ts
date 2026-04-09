import { TTSAdapter, TTSPreviewResult, TTSRenderResult } from './TTSAdapter';
import { Readable } from 'stream';

export class ProviderMock implements TTSAdapter {
  async preview(input: string, options?: any): Promise<TTSPreviewResult> {
    console.log('[ProviderMock] Generating preview stream for:', input, 'Options:', options);
    
    const stream = new Readable({
      read() {
        this.push('Mock audio data chunk 1');
        this.push('Mock audio data chunk 2');
        this.push(null);
      }
    });

    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      stream,
      contentType: 'audio/mpeg'
    };
  }

  async render(input: string, options?: any): Promise<TTSRenderResult> {
    console.log('[ProviderMock] Rendering final audio buffer for:', input, 'Options:', options);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      buffer: Buffer.from('Mock high quality audio buffer'),
      contentType: 'audio/wav'
    };
  }
}
