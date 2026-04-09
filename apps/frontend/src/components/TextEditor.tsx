import React, { useRef } from 'react';

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({ value, onChange }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef({ start: 0, end: 0 });

  const syncSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    selectionRef.current = {
      start: textarea.selectionStart ?? 0,
      end: textarea.selectionEnd ?? textarea.selectionStart ?? 0
    };
  };

  const insertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { start, end } = selectionRef.current;
    const textBefore = value.substring(0, start);
    const textAfter = value.substring(end, value.length);
    const normalizedTag = tag.trim().startsWith('[') ? tag.trim() : `[${tag.trim()}]`;
    
    const newText = `${textBefore} ${normalizedTag} ${textAfter}`;
    onChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      const newPos = start + normalizedTag.length + 2;
      textarea.setSelectionRange(newPos, newPos);
      syncSelection();
    }, 0);
  };

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden flex flex-col h-[500px]">
      {/* Emotion Tags Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100 overflow-x-auto">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mr-2">Emoções:</span>
        {[
          { label: 'Sussurro', tag: '[sussurro]', icon: '🤫' },
          { label: 'Risos', tag: '[risos]', icon: '😄' },
          { label: 'Sarcástico', tag: '[sarcástico]', icon: '😏' },
          { label: 'Gritando', tag: '[gritando]', icon: '📢' },
        ].map((emotion) => (
          <button
            key={emotion.tag}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => insertTag(emotion.tag)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-95"
            title={`Inserir ${emotion.label}`}
          >
            <span>{emotion.icon}</span>
            <span>{emotion.label}</span>
          </button>
        ))}
        <div className="ml-auto text-xs text-gray-400 hidden sm:block">
          Clique para inserir onde está o cursor
        </div>
      </div>

      <div className="relative flex-1 p-8">
        <textarea
          ref={textareaRef}
          className="w-full h-full text-lg leading-relaxed text-gray-800 bg-transparent outline-none resize-none font-medium"
          placeholder="Digite seu texto aqui..."
          value={value}
          maxLength={1000}
          onChange={(e) => onChange(e.target.value)}
          onClick={syncSelection}
          onKeyUp={syncSelection}
          onSelect={syncSelection}
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
