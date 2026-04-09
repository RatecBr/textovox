export interface VoiceControls {
  pitch: number;
  rate: number;
  volume: number;
  timbre: number;
  intensity: number;
  humanization: number;
  pause_before: number;
}

export class SSMLBuilder {
  static buildSSML(text: string, controls: VoiceControls): string {
    const { pitch, rate, volume, pause_before, intensity } = controls;

    // Mapping controls to SSML attributes
    // pitch: -20 to +20 -> +Xst or -Xst
    const pitchStr = pitch >= 0 ? `+${pitch}st` : `${pitch}st`;

    // rate: 0.5 to 2.0 -> percentage. 1.0 = 100%.
    const rateStr = `${Math.round(rate * 100)}%`;

    // volume: -10 to +10 -> +XdB or -XdB
    const volumeStr = volume >= 0 ? `+${volume}dB` : `${volume}dB`;

    // pause_before: seconds -> ms
    const pauseMs = Math.round(pause_before * 1000);

    // intensity: 0.0 to 1.0. Mapping to emphasis levels.
    // < 0.3: reduced, 0.3-0.7: moderate, > 0.7: strong
    let emphasisLevel = 'moderate';
    if (intensity < 0.3) emphasisLevel = 'reduced';
    else if (intensity > 0.7) emphasisLevel = 'strong';

    // Constructing SSML
    let ssml = '<speak>\n';
    
    ssml += `  <prosody rate="${rateStr}" pitch="${pitchStr}" volume="${volumeStr}">\n`;
    
    if (pauseMs > 0) {
      ssml += `    <break time="${pauseMs}ms"/>\n`;
    }

    ssml += `    <emphasis level="${emphasisLevel}">\n`;
    ssml += `      ${text}\n`;
    ssml += `    </emphasis>\n`;
    
    ssml += '  </prosody>\n';
    ssml += '</speak>';

    return ssml;
  }
}
