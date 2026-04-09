import { VoiceControls } from '../services/api';

export const getControlsForVoice = (_voiceId: string): VoiceControls => {
  const DEFAULT_CONTROLS: VoiceControls = {
    pitch: 0,
    rate: 1.0,
    volume: 0,
    timbre: 0,
    intensity: 0.5,
    humanization: 0.3,
    pause_before: 0,
  };

  // Keep controls neutral for all presets.
  // Distinction between voices is handled by backend voice mapping,
  // not by pitch/timbre tweaks here.
  return DEFAULT_CONTROLS;
};
