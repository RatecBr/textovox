import React from 'react';
import { Download } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string | null;
  isLoading: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-center justify-center h-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-gray-300">Gerando áudio...</span>
      </div>
    );
  }

  if (!audioUrl) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-center justify-center h-24">
        <span className="text-gray-500">O preview do áudio aparecerá aqui</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-4">Preview de Áudio</h3>
      <div className="flex items-center space-x-4">
        <audio controls className="w-full" src={audioUrl}>
          Seu navegador não suporta o elemento de áudio.
        </audio>
        
        <button 
          className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
          title="Baixar"
          onClick={() => window.open(audioUrl, '_blank')}
        >
          <Download size={20} className="text-white" />
        </button>
      </div>
      <div className="mt-2 text-xs text-yellow-500">
        * Áudio gerado via streaming
      </div>
    </div>
  );
};
