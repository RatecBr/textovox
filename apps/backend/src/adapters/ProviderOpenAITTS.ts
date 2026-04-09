import OpenAI from 'openai';
import { TTSAdapter, TTSPreviewResult, TTSRenderResult } from './TTSAdapter';
import { Readable } from 'stream';

type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
type EmotionKey = 'neutral' | 'whisper' | 'giggles' | 'sarcastic' | 'shouting';

interface VoiceProfile {
  key: string;
  aliases: string[];
  baseVoice: OpenAIVoice;
  instruction: string;
}

interface EmotionProfile {
  key: EmotionKey;
  aliases: string[];
  speedMultiplier: number;
}

interface EmotionSegment {
  emotion: EmotionKey;
  text: string;
}

interface WavDescriptor {
  formatChunk: Buffer;
  dataChunk: Buffer;
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

const EMOTION_PROFILES: EmotionProfile[] = [
  {
    key: 'whisper',
    aliases: ['whisper', 'sussurro'],
    speedMultiplier: 0.82
  },
  {
    key: 'giggles',
    aliases: ['giggles', 'risos'],
    speedMultiplier: 1.04
  },
  {
    key: 'sarcastic',
    aliases: ['sarcastic', 'sarcástico'],
    speedMultiplier: 0.95
  },
  {
    key: 'shouting',
    aliases: ['shouting', 'gritando'],
    speedMultiplier: 1.12
  }
];

const EMOTION_ALIAS_MAP = new Map<string, EmotionKey>(
  EMOTION_PROFILES.flatMap((profile) => profile.aliases.map((alias) => [alias, profile.key] as const))
);

const TAG_ALIASES_PATTERN = Array.from(EMOTION_ALIAS_MAP.keys())
  .sort((a, b) => b.length - a.length)
  .map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');

const RAW_TAG_REGEX = new RegExp(`\\[{1,2}\\s*(${TAG_ALIASES_PATTERN})\\s*\\]{1,2}`, 'gi');
const NORMALIZED_TAG_REGEX = /\[(whisper|giggles|sarcastic|shouting)\]/gi;

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
    const normalizedInput = this.normalizeEmotionTags(input);
    const { speed, voice, voiceProfile } = this.mapControlsToOptions(options);

    if (this.shouldUseExpressivePipeline(normalizedInput, options)) {
      const buffer = await this.renderExpressiveAudio(normalizedInput, speed, voice, voiceProfile);
      return {
        stream: Readable.from([buffer]),
        contentType: 'audio/wav'
      };
    }

    const cleanInput = this.stripEmotionTags(normalizedInput);
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
    const normalizedInput = this.normalizeEmotionTags(input);
    const { speed, voice, voiceProfile } = this.mapControlsToOptions(options);

    if (this.shouldUseExpressivePipeline(normalizedInput, options)) {
      const buffer = await this.renderExpressiveAudio(normalizedInput, speed, voice, voiceProfile);
      return {
        buffer,
        contentType: 'audio/wav'
      };
    }

    return {
      buffer: await this.generateSpeechBuffer(this.stripEmotionTags(normalizedInput) || ' ', voice, speed, 'wav'),
      contentType: 'audio/wav'
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

  private shouldUseExpressivePipeline(input: string, options?: any) {
    return this.hasEmotionTags(input) || Boolean(options?.expressive);
  }

  private hasEmotionTags(input: string) {
    return input.match(RAW_TAG_REGEX) !== null;
  }

  private normalizeEmotionTags(input: string) {
    return input.replace(RAW_TAG_REGEX, (_, rawTag: string) => {
      const canonical = EMOTION_ALIAS_MAP.get(rawTag.toLowerCase()) || 'neutral';
      return canonical === 'neutral' ? '' : `[${canonical}]`;
    });
  }

  private stripEmotionTags(input: string) {
    return input.replace(RAW_TAG_REGEX, ' ').replace(NORMALIZED_TAG_REGEX, ' ').replace(/\s+/g, ' ').trim();
  }

  private parseEmotionSegments(input: string): EmotionSegment[] {
    const normalized = this.normalizeEmotionTags(input);
    const segments: EmotionSegment[] = [];
    let currentEmotion: EmotionKey = 'neutral';
    let lastIndex = 0;

    normalized.replace(NORMALIZED_TAG_REGEX, (match, emotion: string, offset: number) => {
      const text = normalized.slice(lastIndex, offset);
      this.pushSegmentChunks(segments, currentEmotion, text);
      currentEmotion = emotion.toLowerCase() as EmotionKey;
      lastIndex = offset + match.length;
      return match;
    });

    this.pushSegmentChunks(segments, currentEmotion, normalized.slice(lastIndex));

    if (!segments.length) {
      const cleanText = this.stripEmotionTags(normalized);
      if (cleanText) {
        segments.push({ emotion: 'neutral', text: cleanText });
      }
    }

    return segments;
  }

  private pushSegmentChunks(segments: EmotionSegment[], emotion: EmotionKey, text: string) {
    const cleanText = text.replace(/\s+/g, ' ').trim();
    if (!cleanText) {
      return;
    }

    for (const chunk of this.splitLongText(cleanText)) {
      segments.push({ emotion, text: chunk });
    }
  }

  private splitLongText(text: string) {
    if (text.length <= 220) {
      return [text];
    }

    const sentences = text.match(/[^.!?;:]+[.!?;:]?/g)?.map((part) => part.trim()).filter(Boolean) || [text];
    const chunks: string[] = [];
    let current = '';

    for (const sentence of sentences) {
      if (sentence.length > 220) {
        if (current) {
          chunks.push(current);
          current = '';
        }

        chunks.push(...this.splitByWords(sentence, 180));
        continue;
      }

      const candidate = current ? `${current} ${sentence}` : sentence;
      if (candidate.length > 220 && current) {
        chunks.push(current);
        current = sentence;
      } else {
        current = candidate;
      }
    }

    if (current) {
      chunks.push(current);
    }

    return chunks;
  }

  private splitByWords(text: string, limit: number) {
    const words = text.split(/\s+/).filter(Boolean);
    const chunks: string[] = [];
    let current = '';

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length > limit && current) {
        chunks.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }

    if (current) {
      chunks.push(current);
    }

    return chunks;
  }

  private getEmotionProfile(emotion: EmotionKey) {
    return EMOTION_PROFILES.find((profile) => profile.key === emotion);
  }

  private async renderExpressiveAudio(input: string, baseSpeed: number, voice: OpenAIVoice, voiceProfile?: VoiceProfile) {
    const segments = this.parseEmotionSegments(input);
    const buffers: Buffer[] = [];

    for (const segment of segments) {
      const segmentVoice = voiceProfile?.baseVoice || voice;
      buffers.push(
        await this.generateSpeechBuffer(
          segment.text,
          segmentVoice,
          this.getSegmentSpeed(baseSpeed, segment.emotion),
          'wav'
        )
      );
    }

    return this.mergeWavBuffers(buffers);
  }

  private getSegmentSpeed(baseSpeed: number, emotion: EmotionKey) {
    const profile = this.getEmotionProfile(emotion);
    const emotionSpeed = profile ? baseSpeed * profile.speedMultiplier : baseSpeed;
    return Math.max(0.25, Math.min(4.0, emotionSpeed));
  }

  private async generateSpeechBuffer(input: string, voice: OpenAIVoice, speed: number, format: 'mp3' | 'wav') {
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

  private mergeWavBuffers(buffers: Buffer[]) {
    if (!buffers.length) {
      throw new Error('No WAV buffers generated');
    }

    if (buffers.length === 1) {
      return buffers[0];
    }

    const descriptors = buffers.map((buffer) => this.parseWav(buffer));
    const firstDescriptor = descriptors[0];
    const totalDataLength = descriptors.reduce((sum, descriptor) => sum + descriptor.dataChunk.length, 0);
    const riffSize = 4 + (8 + firstDescriptor.formatChunk.length) + (8 + totalDataLength);
    const padding = totalDataLength % 2 === 1 ? 1 : 0;
    const output = Buffer.alloc(12 + 8 + firstDescriptor.formatChunk.length + 8 + totalDataLength + padding);
    let offset = 0;

    output.write('RIFF', offset);
    offset += 4;
    output.writeUInt32LE(riffSize + padding, offset);
    offset += 4;
    output.write('WAVE', offset);
    offset += 4;

    output.write('fmt ', offset);
    offset += 4;
    output.writeUInt32LE(firstDescriptor.formatChunk.length, offset);
    offset += 4;
    firstDescriptor.formatChunk.copy(output, offset);
    offset += firstDescriptor.formatChunk.length;

    output.write('data', offset);
    offset += 4;
    output.writeUInt32LE(totalDataLength, offset);
    offset += 4;

    for (const descriptor of descriptors) {
      if (!descriptor.formatChunk.equals(firstDescriptor.formatChunk)) {
        throw new Error('Incompatible WAV segments generated for merge');
      }

      descriptor.dataChunk.copy(output, offset);
      offset += descriptor.dataChunk.length;
    }

    return output;
  }

  private parseWav(buffer: Buffer): WavDescriptor {
    if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
      throw new Error('Invalid WAV buffer');
    }

    let offset = 12;
    let formatChunk: Buffer | undefined;
    let dataChunk: Buffer | undefined;

    while (offset + 8 <= buffer.length) {
      const chunkId = buffer.toString('ascii', offset, offset + 4);
      const chunkSize = buffer.readUInt32LE(offset + 4);
      const chunkStart = offset + 8;
      const chunkEnd = chunkSize === 0xffffffff ? buffer.length : chunkStart + chunkSize;

      if (chunkEnd > buffer.length && chunkId !== 'data') {
        break;
      }

      if (chunkId === 'fmt ') {
        formatChunk = buffer.slice(chunkStart, chunkEnd);
      }

      if (chunkId === 'data') {
        dataChunk = buffer.slice(chunkStart, Math.min(chunkEnd, buffer.length));
      }

      offset = chunkEnd + (chunkSize % 2);
    }

    if (!formatChunk || !dataChunk) {
      throw new Error('WAV buffer missing fmt or data chunk');
    }

    return {
      formatChunk,
      dataChunk
    };
  }
}
