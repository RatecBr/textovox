import React from 'react';

interface PresetSelectorProps {
  onSelect: (preset: string) => void;
}

const PRESETS = [
  { id: 'default', name: 'Padrão' },
  { id: 'news', name: 'Âncora de Notícias' },
  { id: 'story', name: 'Narrador de Histórias' },
  { id: 'assistant', name: 'Assistente Virtual' },
  { id: 'child', name: 'Criança' },
  { id: 'elderly', name: 'Idoso' },
];

export const PresetSelector: React.FC<PresetSelectorProps> = ({ onSelect }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-2">Estilo de Voz</label>
      <select
        onChange={(e) => onSelect(e.target.value)}
        className="w-full bg-gray-900 text-white p-2 rounded-md border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
      >
        {PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.name}
          </option>
        ))}
      </select>
    </div>
  );
};
