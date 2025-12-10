import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import HoverPlugin from 'wavesurfer.js/dist/plugins/hover.esm.js';
import { Play, Pause, Scan, Repeat, ArrowDown, Loader2, Music, ZoomIn } from 'lucide-react';
import { RegionData, ProcessingSettings } from '../types';
import { audioBufferToWav } from '../services/audioUtils';
import { processAudio } from '../services/audioService';

interface WaveformEditorProps {
  url: string;
  audioBuffer: AudioBuffer; 
  onRegionChange: (region: RegionData) => void;
  selectedDuration: number;
  settings: ProcessingSettings;
}

const WaveformEditor: React.FC<WaveformEditorProps> = ({ 
  url, 
  audioBuffer, 
  onRegionChange, 
  selectedDuration,
  settings 
}) => {
  // --- Refs ---
  const overviewContainerRef = useRef<HTMLDivElement>(null);
  const overviewTimelineRef = useRef<HTMLDivElement>(null);
  const overviewWs = useRef<WaveSurfer | null>(null);
  const overviewRegions = useRef<any>(null);

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorTimelineRef = useRef<HTMLDivElement>(null);
  const editorWs = useRef<WaveSurfer | null>(null);
  const editorBlobUrlRef = useRef<string | null>(null);
  
  const activeRegionRef = useRef<RegionData>({ start: 0, end: 10 });
  const isUpdatingPreview = useRef(false);

  // --- State ---
  const [isPlaying, setIsPlaying] = useState(false); 
  const [isOverviewPlaying, setIsOverviewPlaying] = useState(false); 
  const [isLooping, setIsLooping] = useState(true); 
  const [currentTime, setCurrentTime] = useState(0);
  const [editorDuration, setEditorDuration] = useState(0);
  
  const [isOverviewReady, setIsOverviewReady] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);

  // --- Helper: Fast Buffer Slicing ---
  const sliceBuffer = (buffer: AudioBuffer, start: number, end: number) => {
    const rate = buffer.sampleRate;
    const startOffset = Math.max(0, Math.floor(start * rate));
    const endOffset = Math.min(buffer.length, Math.floor(end * rate));
    const frameCount = endOffset - startOffset;
    
    if (frameCount <= 0) return null;

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const newBuffer = ctx.createBuffer(buffer.numberOfChannels, frameCount, rate);

    for (let i = 0; i < buffer.numberOfChannels; i++) {
        newBuffer.copyToChannel(buffer.getChannelData(i).subarray(startOffset, endOffset), i, 0);
    }
    return newBuffer;
  };

  // --- Core: Generate Preview ---
  const generatePreview = useCallback(async (
    region: RegionData, 
    currentSettings: ProcessingSettings,
    fastMode: boolean = false
  ) => {
      if (!audioBuffer || !editorWs.current) return;
      
      if (isUpdatingPreview.current && fastMode) return;
      
      isUpdatingPreview.current = true;
      if (!fastMode) setIsEditorReady(false);

      try {
        let processedBuffer: AudioBuffer | null = null;

        if (fastMode) {
             processedBuffer = sliceBuffer(audioBuffer, region.start, region.end);
        } else {
             processedBuffer = await processAudio(audioBuffer, region, currentSettings);
        }

        if (processedBuffer) {
            const wavBytes = audioBufferToWav(processedBuffer);
            const blob = new Blob([wavBytes], { type: 'audio/wav' });
            const newUrl = URL.createObjectURL(blob);
            
            if (editorBlobUrlRef.current) URL.revokeObjectURL(editorBlobUrlRef.current);
            editorBlobUrlRef.current = newUrl;
            
            const ws = editorWs.current;
            const wasPlaying = ws.isPlaying();
            
            await ws.load(newUrl);
            setEditorDuration(processedBuffer.duration);
            
            if (wasPlaying && !fastMode) {
                await ws.play();
            }
        }
      } catch (e: any) {
          if (e.name !== 'AbortError' && e.message !== 'The user aborted a request.') {
              console.error("Preview generation failed", e);
          }
      } finally {
          isUpdatingPreview.current = false;
          setIsEditorReady(true);
      }
  }, [audioBuffer]);

  useEffect(() => {
     if (!isOverviewReady) return;
     const timer = setTimeout(() => {
         generatePreview(activeRegionRef.current, settings, false);
     }, 200); 
     return () => clearTimeout(timer);
  }, [settings, generatePreview, isOverviewReady]);

  // --- DOM Helpers ---
  const createHandleElement = (position: 'left' | 'right') => {
    const handle = document.createElement('div');
    Object.assign(handle.style, {
      position: 'absolute',
      top: '50%',
      width: '4px',
      height: '40px', 
      backgroundColor: '#ffffff',
      borderRadius: '4px',
      boxShadow: '0 0 10px rgba(0,0,0,0.5)', 
      zIndex: '10',
      cursor: position === 'left' ? 'w-resize' : 'e-resize',
      transform: 'translateY(-50%)',
      [position]: '0',
      transition: 'height 0.2s',
      pointerEvents: 'none',
    });
    return handle;
  };

  // --- Effect: Initialize Overview ---
  useEffect(() => {
    if (!overviewContainerRef.current || !overviewTimelineRef.current) return;

    const duration = audioBuffer.duration;
    let adaptiveInterval = 10;
    if (duration <= 10) adaptiveInterval = 1;      
    else if (duration <= 30) adaptiveInterval = 5; 
    else if (duration <= 60) adaptiveInterval = 10;
    else if (duration <= 180) adaptiveInterval = 15;
    else if (duration <= 300) adaptiveInterval = 30;
    else adaptiveInterval = 60;                    

    const wsRegions = RegionsPlugin.create();
    overviewRegions.current = wsRegions;

    const wsTimeline = TimelinePlugin.create({
        container: overviewTimelineRef.current,
        height: 16,
        timeInterval: adaptiveInterval, 
        primaryLabelInterval: adaptiveInterval,
        style: {
            fontSize: '10px',
            color: '#8e8e93', 
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        },
    });

    const ws = WaveSurfer.create({
      container: overviewContainerRef.current,
      height: 80,
      waveColor: 'rgba(255, 255, 255, 0.2)',
      progressColor: 'rgba(255, 255, 255, 0.2)', 
      cursorColor: '#0A84FF', 
      cursorWidth: 1,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      normalize: true,
      interact: true, 
      plugins: [wsRegions, wsTimeline],
    });

    overviewWs.current = ws;
    
    ws.load(url).catch(err => {
        console.warn("Overview load error:", err);
    });

    ws.on('ready', () => {
      setIsOverviewReady(true);
      const duration = ws.getDuration();
      wsRegions.clearRegions();

      const startPoint = Math.max(0, (duration / 2) - 15);
      const endPoint = Math.min(startPoint + 30, duration);
      
      activeRegionRef.current = { start: startPoint, end: endPoint };
      
      wsRegions.addRegion({
        start: startPoint,
        end: endPoint,
        color: 'rgba(10, 132, 255, 0.2)', 
        drag: true,
        resize: true,
        id: 'selection',
      });

      generatePreview({ start: startPoint, end: endPoint }, settings, false);
    });

    ws.on('play', () => {
        setIsOverviewPlaying(true);
        if (editorWs.current) editorWs.current.pause();
    });
    ws.on('pause', () => setIsOverviewPlaying(false));
    ws.on('finish', () => setIsOverviewPlaying(false));

    wsRegions.on('region-created', (region: any) => {
        wsRegions.getRegions().forEach((r: any) => {
            if (r.id !== region.id) r.remove();
        });
        
        region.element.appendChild(createHandleElement('left'));
        region.element.appendChild(createHandleElement('right'));
        region.element.addEventListener('click', (e: Event) => e.stopPropagation());
    });

    wsRegions.on('region-update', (region: any) => {
        onRegionChange({ start: region.start, end: region.end });
        activeRegionRef.current = { start: region.start, end: region.end };
        generatePreview({ start: region.start, end: region.end }, settings, true);
    });

    wsRegions.on('region-updated', (region: any) => {
         activeRegionRef.current = { start: region.start, end: region.end };
         generatePreview({ start: region.start, end: region.end }, settings, false);
    });

    return () => {
      ws.destroy();
      if (editorBlobUrlRef.current) URL.revokeObjectURL(editorBlobUrlRef.current);
    };
  }, [url]);

  // --- Effect: Initialize Editor ---
  useEffect(() => {
     if (!editorContainerRef.current || !editorTimelineRef.current) return;

     const wsTimeline = TimelinePlugin.create({
        container: editorTimelineRef.current,
        height: 16,
        style: {
            fontSize: '10px',
            color: '#8e8e93',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
        },
        timeInterval: 1,
     });

     const ws = WaveSurfer.create({
        container: editorContainerRef.current,
        height: 140,
        waveColor: 'rgba(10, 132, 255, 0.4)', // iOS Blue dimmed
        progressColor: '#0A84FF', // iOS Blue
        cursorColor: '#fff',
        barWidth: 3,
        barGap: 2,
        barRadius: 3,
        minPxPerSec: 50,
        hideScrollbar: false,
        autoCenter: true,
        plugins: [wsTimeline]
     });

     editorWs.current = ws;

     ws.on('ready', () => setIsEditorReady(true));
     ws.on('audioprocess', (t) => setCurrentTime(t));
     ws.on('interaction', (t) => setCurrentTime(t));
     ws.on('play', () => {
         setIsPlaying(true);
         if (overviewWs.current) overviewWs.current.pause();
     });
     ws.on('pause', () => setIsPlaying(false));
     ws.on('finish', () => {
         if (isLooping) {
             ws.play().catch(e => console.warn("Loop play error:", e));
         } else {
             setIsPlaying(false);
         }
     });

     return () => {
         ws.destroy();
     }
  }, []);

  const toggleEditorPlay = async () => {
      if (editorWs.current && isEditorReady) {
          try {
             await editorWs.current.playPause();
          } catch (err) {
             console.error("Toggle play error:", err);
          }
      }
  };

  const toggleOverviewPlay = () => {
      if (overviewWs.current) {
          overviewWs.current.playPause();
      }
  };

  const formatTime = (s: number) => {
      const min = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      const ms = Math.floor((s % 1) * 10);
      return `${min}:${sec.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. PANORAMIC PREVIEW (Source) */}
      <div className="bg-[#1c1c1e] rounded-[22px] p-5 shadow-sm">
         <div className="flex flex-row justify-between items-center mb-4">
            <span className="text-[13px] font-semibold text-[#8e8e93] uppercase tracking-wide">全曲概览 & 选择范围</span>
            
            <button 
                onClick={toggleOverviewPlay}
                disabled={!isOverviewReady}
                className="w-8 h-8 rounded-full bg-[#2c2c2e] hover:bg-[#3a3a3c] flex items-center justify-center text-white transition-colors"
                title="预览原曲"
            >
                {isOverviewPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
            </button>
         </div>
         
         <div className="relative rounded-lg overflow-hidden bg-[#000000] border border-[#2c2c2e]">
             <div className="relative h-[80px]">
                <div ref={overviewContainerRef} className="w-full h-full" />
                {!isOverviewReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                        <Loader2 className="animate-spin text-[#8e8e93]" size={20} />
                    </div>
                )}
             </div>
             <div ref={overviewTimelineRef} className="w-full bg-[#1c1c1e] border-t border-[#2c2c2e]" />
         </div>
         
         <style>{`
            .wavesurfer-region {
                z-index: 100 !important;
                border-radius: 6px !important;
                border: 1px solid rgba(255, 255, 255, 0.6);
            }
         `}</style>
      </div>

      {/* 2. DETAILED EDITOR (Clip) */}
      <div className="bg-[#1c1c1e] rounded-[22px] p-5 shadow-sm relative overflow-hidden">
         <div className="flex flex-row justify-between items-center mb-5">
            <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-[#007AFF] uppercase tracking-wide flex items-center gap-2">
                   <ZoomIn size={14}/> 剪辑预览
                </span>
                <span className="text-[13px] text-[#8e8e93] mt-1 font-mono">
                   {formatTime(selectedDuration)}
                </span>
            </div>
            
            <div className="flex items-center gap-3">
                 <button 
                    onClick={() => setIsLooping(!isLooping)}
                    className={`
                        w-9 h-9 rounded-full flex items-center justify-center transition-all
                        ${isLooping 
                            ? 'bg-[#007AFF]/10 text-[#007AFF]' 
                            : 'bg-[#2c2c2e] text-[#8e8e93]'
                        }
                    `}
                    title="循环播放"
                 >
                    <Repeat size={16} />
                 </button>

                 <button 
                    onClick={toggleEditorPlay}
                    disabled={!isEditorReady}
                    className={`
                        h-10 px-5 rounded-full flex items-center justify-center gap-2 transition-all font-semibold text-[15px]
                        ${isPlaying 
                            ? 'bg-[#007AFF] text-white shadow-lg shadow-[#007AFF]/30' 
                            : 'bg-white text-black hover:bg-[#f2f2f7]'
                        }
                    `}
                >
                    {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                    <span>{isPlaying ? '暂停' : '播放'}</span>
                </button>
            </div>
         </div>
         
         <div className="relative rounded-lg overflow-hidden bg-[#000000] border border-[#2c2c2e]">
             <div className="relative h-[140px]">
                <div ref={editorContainerRef} className="w-full h-full" />
                {!isEditorReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                        <Loader2 className="animate-spin text-[#8e8e93]" size={24} />
                    </div>
                )}
             </div>
             <div ref={editorTimelineRef} className="w-full bg-[#1c1c1e] border-t border-[#2c2c2e]" />
         </div>
      </div>
    </div>
  );
};

export default WaveformEditor;