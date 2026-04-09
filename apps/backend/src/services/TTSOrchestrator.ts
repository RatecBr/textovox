import { SSMLBuilder } from './SSMLBuilder';
import { TTSAdapter } from '../adapters/TTSAdapter';
import { ProviderMock } from '../adapters/ProviderMock';
import { ProviderOpenAITTS } from '../adapters/ProviderOpenAITTS';
import { Readable } from 'stream';

export class TTSOrchestrator {
  private adapters: Map<string, TTSAdapter>;

  constructor() {
    this.adapters = new Map();
    this.adapters.set('mock', new ProviderMock());
    this.adapters.set('openai', new ProviderOpenAITTS());
  }

  private getAdapter(providerName?: string): TTSAdapter {
    // Default to 'openai' if configured, otherwise 'mock'
    const name = providerName || 'openai';
    const adapter = this.adapters.get(name);
    if (!adapter) {
      console.warn(`Provider ${name} not found, falling back to mock`);
      return this.adapters.get('mock')!;
    }
    return adapter;
  }

  async generatePreview(text: string, controls: any): Promise<{ stream: Readable, contentType: string }> {
    const providerName = controls.provider || 'openai';
    const adapter = this.getAdapter(providerName);

    try {
      let input = text;
      if (providerName !== 'openai') {
        input = SSMLBuilder.buildSSML(text, controls);
      }

      return await adapter.preview(input, controls);
    } catch (error) {
      console.error('Orchestrator Preview Error:', error);
      if (providerName === 'openai') {
        console.log('Falling back to mock provider due to error');
        const mockAdapter = this.adapters.get('mock')!;
        const ssml = SSMLBuilder.buildSSML(text, controls);
        return await mockAdapter.preview(ssml, controls);
      }
      throw error;
    }
  }

  async renderFinal(text: string, controls: any): Promise<{ buffer: Buffer, contentType: string }> {
    const providerName = controls.provider || 'openai';
    const adapter = this.getAdapter(providerName);

    try {
      let input = text;
      if (providerName !== 'openai') {
        input = SSMLBuilder.buildSSML(text, controls);
      }

      return await adapter.render(input, controls);
    } catch (error) {
      console.error('Orchestrator Render Error:', error);
      throw error;
    }
  }
}
