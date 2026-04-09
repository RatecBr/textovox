import React, { useEffect, useState } from 'react';
import { TopNavigation } from '../components/TopNavigation';
import { TextEditor } from '../components/TextEditor';
import { VoiceChips } from '../components/VoiceChips';
import { VoiceControls } from '../components/VoiceControls';
import { ttsApi, VoiceControls as VoiceControlsType } from '../services/api';
import { Play, Download, Pause } from 'lucide-react';

import { getControlsForVoice } from '../utils/voiceUtils';

const DEFAULT_CONTROLS: VoiceControlsType = {
  pitch: 0,
  rate: 1.0,
  volume: 0,
  timbre: 0,
  intensity: 0.5,
  humanization: 0.3,
  pause_before: 0,
};

export const Home: React.FC = () => {
  const [text, setText] = useState('Ainda que as palavras sejam incapazes de traduzir o imenso carinho que sinto por você, permita-me silenciar e deixar o meu coração falar.');
  const [controls, setControls] = useState<VoiceControlsType>(DEFAULT_CONTROLS);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFormat, setAudioFormat] = useState<'mp3' | 'wav'>('mp3');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState('pedro');
  const [lastGeneratedText, setLastGeneratedText] = useState<string | null>(null);
  const [lastGeneratedVoice, setLastGeneratedVoice] = useState<string | null>(null);
  const [lastGeneratedControls, setLastGeneratedControls] = useState<VoiceControlsType | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const lastObjectUrlRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (!audioUrl) {
      if (lastObjectUrlRef.current) {
        URL.revokeObjectURL(lastObjectUrlRef.current);
        lastObjectUrlRef.current = null;
      }
      return;
    }

    if (lastObjectUrlRef.current && lastObjectUrlRef.current !== audioUrl) {
      URL.revokeObjectURL(lastObjectUrlRef.current);
    }
    lastObjectUrlRef.current = audioUrl;
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (lastObjectUrlRef.current) {
        URL.revokeObjectURL(lastObjectUrlRef.current);
      }
    };
  }, []);
  const handleVoiceSelect = (voiceId: string) => {
    setSelectedVoiceId(voiceId);
    console.log('Voice Selected:', voiceId);
    
    const newControls = getControlsForVoice(voiceId);
    setControls(newControls);
  };

  const handleControlChange = (key: keyof VoiceControlsType, value: number) => {
    setControls((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleGeneratePreview = async () => {
    // If already playing, just pause
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }
    
    // If paused but has audio, and text/voice/controls haven't changed, resume
    if (
      !isPlaying && 
      audioUrl && 
      audioRef.current && 
      text === lastGeneratedText && 
      selectedVoiceId === lastGeneratedVoice &&
      JSON.stringify(controls) === JSON.stringify(lastGeneratedControls)
    ) {
        audioRef.current.play();
        setIsPlaying(true);
        return;
    }

    setIsLoading(true);
    setAudioUrl(null);
    try {
      const result = await ttsApi.preview({
        text,
        voice: selectedVoiceId,
        controls,
      });
      setAudioUrl(result.audioUrl);
      setAudioFormat(result.format === 'wav' ? 'wav' : 'mp3');
      setLastGeneratedText(text);
      setLastGeneratedVoice(selectedVoiceId);
      setLastGeneratedControls(controls);
      setIsPlaying(true); // Auto-play when ready
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Falha ao gerar o preview.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `textovox-${selectedVoiceId}-${Date.now()}.${audioFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-white font-sans">
      <div className="container mx-auto px-6 py-6 max-w-7xl">
        
        {/* Top Navigation */}
        <TopNavigation />

        {/* Main Content Area */}
        <div className="bg-white rounded-2xl p-2 shadow-2xl mb-8">
          <TextEditor value={text} onChange={setText} />
        </div>

        {/* Voice Selection Chips */}
        <div className="mb-8">
          <VoiceChips selectedVoiceId={selectedVoiceId} onSelect={handleVoiceSelect} />
          
          {/* Advanced Controls (Collapsible) */}
          <VoiceControls controls={controls} onChange={handleControlChange} />
        </div>

        {/* Bottom Control Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-8 py-4 flex items-center justify-between shadow-2xl text-black">
          
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span className="font-bold text-sm">PORTUGUESE</span>
            </button>
          </div>

          <div className="flex items-center space-x-6">
             <button 
               onClick={handleGeneratePreview}
               disabled={isLoading || !text}
               className={`flex items-center space-x-3 px-8 py-3 rounded-full font-bold text-white transition-all transform hover:scale-105 ${
                 isLoading ? 'bg-gray-800' : 'bg-black hover:bg-gray-800'
               }`}
             >
               {isLoading ? (
                 <>
                   <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                   <span>GERANDO...</span>
                 </>
               ) : isPlaying ? (
                 <>
                   <Pause size={20} fill="currentColor" />
                   <span>PAUSAR</span>
                 </>
               ) : (
                 <>
                   <Play size={20} fill="currentColor" />
                   <span>{audioUrl && text === lastGeneratedText ? 'TOCAR' : 'GERAR / TOCAR'}</span>
                 </>
               )}
             </button>
          </div>

          <div className="flex items-center space-x-4">
            {audioUrl && (
              <button 
                onClick={handleDownload}
                className="p-3 rounded-full hover:bg-gray-100 border border-gray-300 transition-colors"
                title="Baixar áudio"
              >
                <Download size={20} />
              </button>
            )}
            <div className="text-xs text-gray-400 font-medium">
              Desenvolvido por TextoVox v1.0
            </div>
          </div>
        </div>

        {/* Hidden Audio Element for Logic */}
        {audioUrl && (
          <audio 
            ref={audioRef}
            src={audioUrl} 
            autoPlay 
            className="hidden" 
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
          />
        )}
        
        {/* Spacer for fixed bottom bar */}
        <div className="h-24"></div>
      </div>
    </div>
  );
};
