import OpenAI from 'openai';
import { TTSAdapter, TTSPreviewResult, TTSRenderResult } from './TTSAdapter';
import { Readable } from 'stream';

type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

interface VoiceProfile {
  key: string;
  aliases: string[];
  baseVoice: OpenAIVoice;
  instruction: string;
}

const VOICE_PROFILES: VoiceProfile[] = [
  {
    key: 'pedro',
    aliases: ['will', 'narrator', 'pedro'],
    baseVoice: 'echo',
    instruction: 'Identidade vocal masculina, adulta, calorosa, confiante e estável. Fale em português do Brasil com dicção limpa e presença profissional.'
  },
  {
    key: 'rick',
    aliases: ['rick'],
    baseVoice: 'fable',
    instruction: 'Identidade vocal de menino, jovem, curioso, energético e natural. Soe realmente como uma criança brasileira, sem parecer adulto acelerado.'
  },
  {
    key: 'leila',
    aliases: ['leila'],
    baseVoice: 'shimmer',
    instruction: 'Identidade vocal de menina, doce, leve, inocente e natural. Soe realmente como uma criança brasileira, com suavidade e espontaneidade.'
  },
  {
    key: 'paty',
    aliases: ['paty', 'friendly'],
    baseVoice: 'alloy',
    instruction: 'Identidade vocal feminina, amigável, clara, acolhedora e conversacional. Soe humana, próxima e natural.'
  },
  {
    key: 'lia',
    aliases: ['lia', 'ruy', 'carla'],
    baseVoice: 'nova',
    instruction: 'Identidade vocal feminina, jovem adulta, viva, energética e expressiva. Mantenha entusiasmo sem perder clareza.'
  },
  {
    key: 'evelin',
    aliases: ['evelin'],
    baseVoice: 'shimmer',
    instruction: 'Identidade vocal feminina, suave, serena, íntima e delicada. Mantenha calor humano e textura macia.'
  },
  {
    key: 'eloy',
    aliases: ['dialogue', 'eloy'],
    baseVoice: 'onyx',
    instruction: 'Identidade vocal masculina, profunda, grave, narrativa e marcante. Soe humana, firme e envolvente.'
  }
];

const LEGACY_TAG_REGEX = /\[{1,2}\s*(whisper|sussurro|giggles|risos|sarcastic|sarcástico|shouting|gritando)\s*\]{1,2}/gi;

export class ProviderOpenAITTS implements TTSAdapter {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OPENAI_API_KEY is not set. OpenAI TTS will fail.');
    }
    this.openai = new OpenAI({ apiKey: apiKey || 'dummy-key' });
  }

  async preview(input: string, options?: any): Promise<TTSPreviewResult> {
    const { speed, voice } = this.mapControlsToOptions(options);
    const cleanInput = this.stripLegacyTags(input);
    const response = await this.openai.audio.speech.create({
      model: 'tts-1-hd',
      voice,
      input: cleanInput || ' ',
      speed,
      response_format: 'mp3',
    });

    return {
      stream: await this.toNodeReadable(response.body),
      contentType: 'audio/mpeg'
    };
  }

  async render(input: string, options?: any): Promise<TTSRenderResult> {
    const { speed, voice } = this.mapControlsToOptions(options);
    return {
      buffer: await this.generateSpeechBuffer(this.stripLegacyTags(input) || ' ', voice, speed, 'mp3'),
      contentType: 'audio/mpeg'
    };
  }

  private mapControlsToOptions(controls: any) {
    let speed = 1.0;
    const voiceProfile = this.findVoiceProfile(controls?.voice);
    let voice: OpenAIVoice = voiceProfile?.baseVoice || 'alloy';

    if (controls?.rate) {
      speed = Math.max(0.25, Math.min(4.0, controls.rate));
    }

    if (!voiceProfile && controls?.timbre !== undefined) {
      const t = controls.timbre;
      if (t < -0.66) voice = 'alloy';
      else if (t < -0.33) voice = 'echo';
      else if (t < 0) voice = 'fable';
      else if (t < 0.33) voice = 'onyx';
      else if (t < 0.66) voice = 'nova';
      else voice = 'shimmer';
    }

    return { speed, voice, voiceProfile };
  }

  private findVoiceProfile(voiceId?: string): VoiceProfile | undefined {
    if (!voiceId) {
      return undefined;
    }

    const normalizedVoiceId = voiceId.toLowerCase();
    return VOICE_PROFILES.find((profile) => profile.aliases.some((alias) => normalizedVoiceId.includes(alias)));
  }

  private stripLegacyTags(input: string) {
    return input.replace(LEGACY_TAG_REGEX, ' ').replace(/\s+/g, ' ').trim();
  }

  private async generateSpeechBuffer(input: string, voice: OpenAIVoice, speed: number, format: 'mp3') {
    const response = await this.openai.audio.speech.create({
      model: 'tts-1-hd',
      voice,
      input,
      speed,
      response_format: format,
    });

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  private async toNodeReadable(body: any) {
    if (body instanceof Readable) {
      return body as Readable;
    }

    if (body && typeof body.getReader === 'function') {
      return Readable.fromWeb(body);
    }

    throw new Error('Unexpected response body type from OpenAI SDK');
  }
}
