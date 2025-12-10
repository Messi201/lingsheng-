import { ProcessingSettings, RegionData } from '../types';
import { audioBufferToWav } from './audioUtils';

/**
 * Decodes an ArrayBuffer (from video or audio file) into an AudioBuffer.
 * This utilizes the browser's native implementation which supports most formats (MP4, MP3, AAC, etc).
 */
export const decodeAudioData = async (arrayBuffer: ArrayBuffer): Promise<AudioBuffer> => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  return await audioContext.decodeAudioData(arrayBuffer);
};

/**
 * Generates an Impulse Response buffer for the ConvolverNode to simulate reverb.
 */
const createImpulseResponse = (sampleRate: number, duration: number, decay: number): AudioBuffer => {
  const length = sampleRate * duration;
  const ctx = new OfflineAudioContext(2, length, sampleRate);
  const impulse = ctx.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      // White noise * decay envelope
      // Simple exponential decay
      const n = length - i;
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
};

/**
 * Processes the audio offline: applies clipping, speed, volume, fades, EQ, Reverb, and Reverse.
 * Returns a new AudioBuffer containing the processed audio.
 */
export const processAudio = async (
  sourceBuffer: AudioBuffer,
  region: RegionData,
  settings: ProcessingSettings
): Promise<AudioBuffer> => {
  const { start, end } = region;
  const { 
    speed, 
    volume, 
    fadeIn, 
    fadeOut, 
    bass, 
    treble, 
    reverb, 
    isReverse 
  } = settings;
  
  // 1. Extract and Prepare Source Data
  // We manually extract the region first to handle "Reverse" cleanly.
  const sampleRate = sourceBuffer.sampleRate;
  const startOffset = Math.floor(start * sampleRate);
  const endOffset = Math.floor(end * sampleRate);
  const frameCount = endOffset - startOffset;
  
  // Create a temporary buffer for the clip
  const clipBuffer = new AudioBuffer({
    length: frameCount,
    numberOfChannels: sourceBuffer.numberOfChannels,
    sampleRate: sampleRate
  });

  // Copy data
  for (let ch = 0; ch < sourceBuffer.numberOfChannels; ch++) {
    const channelData = sourceBuffer.getChannelData(ch).subarray(startOffset, endOffset);
    const clipData = clipBuffer.getChannelData(ch);
    clipData.set(channelData);
    
    // Apply Reverse if needed
    if (isReverse) {
      clipData.reverse(); 
    }
  }

  // 2. Setup Offline Context
  // Calculate new duration based on speed
  const clipDuration = clipBuffer.duration;
  const newDuration = clipDuration / speed;

  // Add a bit of tail if reverb is high to prevent abrupt cut (optional, but good for ringtones to just fade out)
  // For ringtones, strict duration is preferred, so we stick to newDuration.
  const offlineCtx = new OfflineAudioContext(
    clipBuffer.numberOfChannels,
    Math.ceil(newDuration * sampleRate),
    sampleRate
  );

  // 3. Create Audio Graph
  const source = offlineCtx.createBufferSource();
  source.buffer = clipBuffer;
  source.playbackRate.value = speed;

  // -- EQ Stage --
  const bassNode = offlineCtx.createBiquadFilter();
  bassNode.type = 'lowshelf';
  bassNode.frequency.value = 200; // Standard Bass freq
  bassNode.gain.value = bass; 

  const trebleNode = offlineCtx.createBiquadFilter();
  trebleNode.type = 'highshelf';
  trebleNode.frequency.value = 3000; // Standard Treble freq
  trebleNode.gain.value = treble;

  // -- Reverb Stage --
  // We use a wet/dry merge
  const dryGain = offlineCtx.createGain();
  const wetGain = offlineCtx.createGain();
  const reverbNode = offlineCtx.createConvolver();
  
  if (reverb > 0) {
      // Generate a synthetic impulse response
      // duration 2s, decay 2.0 is a decent 'Hall' sound
      reverbNode.buffer = createImpulseResponse(sampleRate, 2.5, 2.0);
      
      // Standard Equal Power Crossfade or simple linear mix
      dryGain.gain.value = 1.0 - (reverb * 0.4); // Keep dry relatively high
      wetGain.gain.value = reverb * 0.6; // Scale wet
  } else {
      dryGain.gain.value = 1.0;
      wetGain.gain.value = 0;
  }

  // -- Master Gain & Fades --
  const masterGain = offlineCtx.createGain();
  masterGain.gain.setValueAtTime(volume, 0);

  // Fades
  if (fadeIn > 0) {
    masterGain.gain.setValueAtTime(0, 0);
    // Use exponential ramp for more natural fade? Linear is safer for 0 values.
    masterGain.gain.linearRampToValueAtTime(volume, Math.min(fadeIn, newDuration));
  }

  if (fadeOut > 0) {
    const fadeOutStart = Math.max(0, newDuration - fadeOut);
    masterGain.gain.setValueAtTime(volume, fadeOutStart);
    masterGain.gain.linearRampToValueAtTime(0, newDuration);
  }

  // 4. Connect Nodes
  // Source -> Bass -> Treble -> Split
  source.connect(bassNode);
  bassNode.connect(trebleNode);
  
  // Split to Dry/Wet
  trebleNode.connect(dryGain);
  trebleNode.connect(reverbNode);
  reverbNode.connect(wetGain);

  // Merge to Master
  dryGain.connect(masterGain);
  wetGain.connect(masterGain);

  // Master -> Dest
  masterGain.connect(offlineCtx.destination);

  // 5. Render
  source.start(0);
  const renderedBuffer = await offlineCtx.startRendering();
  return renderedBuffer;
};

/**
 * Exports the processed buffer to a Blob.
 */
export const exportAudio = async (
  buffer: AudioBuffer,
  format: string
): Promise<{ blob: Blob; filename: string }> => {
  // Primary export is WAV (lossless, widely supported).
  
  const wavBytes = audioBufferToWav(buffer);
  
  let mimeType = 'audio/wav';
  let ext = 'wav';

  if (format === 'mp3') {
     mimeType = 'audio/wav'; 
     ext = 'wav'; 
  } else if (format === 'm4r') {
     mimeType = 'audio/x-m4r';
     ext = 'm4r';
  }

  const blob = new Blob([wavBytes], { type: mimeType });
  return { blob, filename: `ringtone.${ext}` };
};