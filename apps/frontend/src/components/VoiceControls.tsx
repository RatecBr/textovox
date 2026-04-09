import React, { useState } from 'react';
import { VoiceControls as VoiceControlsType } from '../services/api';
import { ChevronDown, ChevronUp, Sliders } from 'lucide-react';

interface VoiceControlsProps {
  controls: VoiceControlsType;
  onChange: (key: keyof VoiceControlsType, value: number) => void;
}

const ControlSlider: React.FC<{
  label: string;
  name: keyof VoiceControlsType;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (key: keyof VoiceControlsType, value: number) => void;
}> = ({ label, name, value, min, max, step, onChange }) => (
  <div className="mb-4">
    <div className="flex justify-between mb-1">
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <span className="text-xs text-gray-400 font-mono">{value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(name, parseFloat(e.target.value))}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
    />
  </div>
);

export const VoiceControls: React.FC<VoiceControlsProps> = ({ controls, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center space-x-2 text-gray-800">
          <Sliders size={18} />
          <span className="font-bold text-sm">Ajustes Avançados (Timbre, Velocidade, etc.)</span>
        </div>
        {isOpen ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
      </button>
      
      {isOpen && (
        <div className="p-6 bg-white border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            <ControlSlider
              label="Velocidade (Rate)"
              name="rate"
              value={controls.rate}
              min={0.5}
              max={2.0}
              step={0.1}
              onChange={onChange}
            />
            <ControlSlider
              label="Tom (Pitch)"
              name="pitch"
              value={controls.pitch}
              min={-20}
              max={20}
              step={1}
              onChange={onChange}
            />
            <ControlSlider
              label="Timbre"
              name="timbre"
              value={controls.timbre}
              min={-1.0}
              max={1.0}
              step={0.1}
              onChange={onChange}
            />
            <ControlSlider
              label="Intensidade (Expressividade)"
              name="intensity"
              value={controls.intensity}
              min={0.0}
              max={1.0}
              step={0.1}
              onChange={onChange}
            />
            <ControlSlider
              label="Humanização"
              name="humanization"
              value={controls.humanization}
              min={0.0}
              max={1.0}
              step={0.1}
              onChange={onChange}
            />
            <ControlSlider
              label="Volume"
              name="volume"
              value={controls.volume}
              min={-10}
              max={10}
              step={1}
              onChange={onChange}
            />
            <ControlSlider
              label="Pausa Antes (seg)"
              name="pause_before"
              value={controls.pause_before}
              min={0}
              max={2.0}
              step={0.1}
              onChange={onChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};
