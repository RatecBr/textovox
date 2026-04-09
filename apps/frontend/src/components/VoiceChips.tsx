import React, { useState, useRef } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { ttsApi } from '../services/api';
import { getControlsForVoice } from '../utils/voiceUtils';

interface VoiceOption {
  id: string;
  name: string;
  description: string;
  avatarColor: string;
  sampleUrl?: string;
}

interface VoiceChipsProps {
  selectedVoiceId: string;
  onSelect: (voiceId: string) => void;
}

const VOICES: VoiceOption[] = [
  { id: 'pedro', name: 'PEDRO', description: '', avatarColor: 'bg-pink-500' },
  { id: 'rick', name: 'RICK', description: '', avatarColor: 'bg-orange-500' },
  { id: 'paty', name: 'PATY', description: '', avatarColor: 'bg-blue-500' },
  { id: 'lia', name: 'LIA', description: '', avatarColor: 'bg-indigo-500' },
  { id: 'evelin', name: 'EVELIN', description: '', avatarColor: 'bg-green-500' },
  { id: 'eloy', name: 'ELOY', description: '', avatarColor: 'bg-purple-500' },
];

export const VoiceChips: React.FC<VoiceChipsProps> = ({ selectedVoiceId, onSelect }) => {
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlaySample = async (e: React.MouseEvent, voiceId: string, voiceName: string) => {
    e.stopPropagation();

    // Stop current if playing
    if (playingVoiceId === voiceId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingVoiceId(null);
      return;
    }

    // Stop any other playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingVoiceId(null);
    }

    setIsLoading(voiceId);

    try {
      const controls = getControlsForVoice(voiceId);
      const text = `Olá, eu sou ${voiceName}. Esta é uma demonstração da minha voz.`;
      
      const result = await ttsApi.preview({
        text,
        voice: voiceId,
        controls,
      });

      const audio = new Audio(result.audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setPlayingVoiceId(null);
        audioRef.current = null;
      };

      await audio.play();
      setPlayingVoiceId(voiceId);
    } catch (error) {
      console.error('Error playing sample:', error);
      alert('Failed to play sample');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-3 mt-4">
      {VOICES.map((voice) => (
        <button
          key={voice.id}
          onClick={() => onSelect(voice.id)}
          className={`group flex items-center space-x-3 px-4 py-2 rounded-full border transition-all text-sm relative overflow-hidden ${
            selectedVoiceId === voice.id
              ? 'bg-white text-black border-white shadow-lg scale-105'
              : 'bg-gray-900 text-gray-300 border-gray-700 hover:border-gray-500'
          }`}
        >
          <div 
            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
              selectedVoiceId === voice.id ? 'bg-gray-200' : 'bg-gray-800 group-hover:bg-gray-700'
            }`}
            onClick={(e) => handlePlaySample(e, voice.id, voice.name)}
          >
             {isLoading === voice.id ? (
               <Loader2 size={12} className={`animate-spin ${selectedVoiceId === voice.id ? 'text-black' : 'text-white'}`} />
             ) : playingVoiceId === voice.id ? (
               <Pause size={12} className={selectedVoiceId === voice.id ? 'text-black' : 'text-white'} />
             ) : (
               <Play size={12} className={selectedVoiceId === voice.id ? 'text-black' : 'text-white'} />
             )}
          </div>

          <div className="flex flex-col items-start text-xs">
            <span className="font-bold flex items-center gap-2">
              {voice.name}
              <span className={`w-2 h-2 rounded-full ${voice.avatarColor}`}></span>
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};
