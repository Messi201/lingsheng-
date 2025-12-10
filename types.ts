export enum ExportFormat {
  M4R = 'm4r',
  WAV = 'wav',
  MP3 = 'mp3'
}

export interface ProcessingSettings {
  fadeIn: number; // seconds
  fadeOut: number; // seconds
  volume: number; // multiplier (1.0 = 100%)
  speed: number; // multiplier (1.0 = normal)
  // New Effects
  bass: number; // dB (-10 to 15)
  treble: number; // dB (-10 to 15)
  reverb: number; // mix (0.0 to 1.0)
  isReverse: boolean; // toggle
  format: ExportFormat;
}

export interface RegionData {
  start: number;
  end: number;
}

export interface AudioMetadata {
  name: string;
  duration: number;
  size: number;
  type: string;
}