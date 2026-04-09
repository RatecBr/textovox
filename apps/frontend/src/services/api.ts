import axios from 'axios';

export interface VoiceControls {
  pitch: number;
  rate: number;
  volume: number;
  timbre: number;
  intensity: number;
  humanization: number;
  pause_before: number;
  provider?: string;
}

export interface PreviewRequest {
  text: string;
  voice: string;
  controls: VoiceControls;
}

export interface PreviewResponse {
  audioUrl: string;
  duration: number;
  format: string;
  status: string;
  message: string;
  ssmlUsed?: string;
}

const api = axios.create({
  baseURL: 'http://localhost:3001/api', // Ensure absolute URL or proxy
  headers: {
    'Content-Type': 'application/json',
  },
});

export const ttsApi = {
  preview: async (data: PreviewRequest): Promise<PreviewResponse> => {
    const response = await api.post('/tts/preview', data, {
      responseType: 'blob'
    });
    
    const audioUrl = URL.createObjectURL(response.data);
    const contentType = response.headers['content-type'] || 'audio/mpeg';
    const format = contentType.includes('wav') ? 'wav' : 'mp3';
    
    return {
      audioUrl,
      duration: 0,
      format,
      status: 'success',
      message: 'Audio stream received',
      ssmlUsed: response.headers['x-ssml-used']
    };
  },
};
