import React from 'react';

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({ value, onChange }) => {
  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden flex flex-col h-[500px]">
      <div className="relative flex-1 p-8">
        <textarea
          className="w-full h-full text-lg leading-relaxed text-gray-800 bg-transparent outline-none resize-none font-medium"
          placeholder="Digite seu texto aqui..."
          value={value}
          maxLength={1000}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <span>{value.length} / 1000 caracteres (Restam {1000 - value.length})</span>
          <span>{value.split(/\s+/).filter(w => w.length > 0).length} palavras</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>Powered by OpenAI TTS-1-HD</span>
        </div>
      </div>
    </div>
  );
};
