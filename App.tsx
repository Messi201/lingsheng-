import React, { useState, useCallback } from 'react';
import { Scissors, AlertCircle, UploadCloud, ShieldCheck, Zap, SlidersHorizontal, Smartphone, Video, ChevronRight } from 'lucide-react';
import FileUpload from './components/FileUpload';
import WaveformEditor from './components/WaveformEditor';
import Controls from './components/Controls';
import StickyFooter from './components/StickyFooter';
import { decodeAudioData, processAudio, exportAudio } from './services/audioService';
import { ExportFormat, ProcessingSettings, RegionData } from './types';

const INITIAL_SETTINGS: ProcessingSettings = {
  fadeIn: 1.0,
  fadeOut: 1.0,
  volume: 1.0,
  speed: 1.0,
  bass: 0,
  treble: 0,
  reverb: 0,
  isReverse: false,
  format: ExportFormat.M4R
};

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Settings
  const [settings, setSettings] = useState<ProcessingSettings>(INITIAL_SETTINGS);
  const [region, setRegion] = useState<RegionData>({ start: 0, end: 30 });

  // Load file logic
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Cleanup previous URL
      if (fileUrl) URL.revokeObjectURL(fileUrl);
      
      const url = URL.createObjectURL(selectedFile);
      setFileUrl(url);
      setFile(selectedFile);
      
      const arrayBuffer = await selectedFile.arrayBuffer();
      const decodedBuffer = await decodeAudioData(arrayBuffer);
      
      setAudioBuffer(decodedBuffer);
      setRegion({ start: 0, end: Math.min(30, decodedBuffer.duration) });
    } catch (err) {
      console.error(err);
      setError("音频解码失败。请确保文件是有效的视频或音频格式。");
      setFile(null);
      if (fileUrl) URL.revokeObjectURL(fileUrl);
      setFileUrl(null);
    } finally {
      setIsProcessing(false);
    }
  }, [fileUrl]);

  const reset = () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFileUrl(null);
    setFile(null);
    setAudioBuffer(null);
    setSettings(INITIAL_SETTINGS);
  };

  // Export Logic
  const handleExport = async () => {
    if (!audioBuffer) return;

    try {
      setIsProcessing(true);
      const processedBuffer = await processAudio(audioBuffer, region, settings);
      const { blob, filename } = await exportAudio(processedBuffer, settings.format);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);

    } catch (err) {
      console.error(err);
      setError("导出过程中发生错误。");
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedDuration = (region.end - region.start) / settings.speed;

  return (
    <div className="min-h-screen pb-32 font-sans text-[#f5f5f7]">
      
      {/* Header - iOS Navigation Bar Style */}
      <header className="fixed top-0 w-full z-40 bg-black/70 backdrop-blur-xl border-b border-[#3a3a3c]/50 supports-[backdrop-filter]:bg-black/60">
          <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-[#007AFF] rounded-[6px] flex items-center justify-center">
                    <Scissors className="text-white" size={16} />
                </div>
                <h1 className="text-[17px] font-semibold tracking-wide text-white">
                RingTone AI
                </h1>
            </div>
            {/* Empty right side for balance */}
            <div className="w-7"></div>
          </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-24 space-y-10">
        
        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/15 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center space-x-3 animate-in slide-in-from-top-2">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* --- LANDING VIEW (No File) --- */}
        {!audioBuffer && (
          <div className="fade-in space-y-20">
             
             {/* Hero Section */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                 <div className="space-y-8 text-center md:text-left">
                     <div className="inline-flex items-center space-x-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-full px-3 py-1 text-[#8e8e93] text-xs font-medium">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#32d74b] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#32d74b]"></span>
                        </span>
                        <span>本地处理 · 隐私安全</span>
                     </div>
                     <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white flex flex-col items-center md:items-start gap-3 md:gap-4">
                        <span>将任意视频转化为</span>
                        <span className="text-[#007AFF]">专属定制铃声</span>
                     </h2>
                     <p className="text-[#8e8e93] text-base md:text-lg leading-relaxed max-w-md mx-auto md:mx-0">
                        拖入视频 (MP4) 或音频文件。自动提取音频，剪辑完美30秒循环，添加淡入淡出，一键导出 iPhone 或 Android 铃声。
                     </p>
                     
                     <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-5 text-sm font-medium text-[#8e8e93] pt-2">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={18} className="text-[#32d74b]" />
                            <span>100% 隐私安全</span>
                        </div>
                        <div className="hidden sm:block w-1 h-1 bg-[#3a3a3c] rounded-full"></div>
                        <div className="flex items-center gap-2">
                            <Zap size={18} className="text-[#ff9f0a]" />
                            <span>极速提取</span>
                        </div>
                     </div>
                 </div>
                 
                 {/* Upload Component */}
                 <div className="w-full">
                    <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />
                 </div>
             </div>

             {/* Features Grid */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <FeatureCard 
                    icon={ShieldCheck} 
                    title="隐私优先" 
                    desc="文件从不上传服务器。所有处理均在您的浏览器本地完成。"
                    color="bg-[#32d74b]"
                />
                <FeatureCard 
                    icon={Video} 
                    title="视频转音频" 
                    desc="直接从 MP4/MOV 视频中提取高品质音频流进行编辑。"
                    color="bg-[#5e5ce6]"
                />
                <FeatureCard 
                    icon={SlidersHorizontal} 
                    title="专业特效" 
                    desc="支持淡入淡出、低音增强、混响以及精准剪裁工具。"
                    color="bg-[#ff2d55]"
                />
                <FeatureCard 
                    icon={Smartphone} 
                    title="支持双平台" 
                    desc="导出 iPhone 专用 .m4r 格式及安卓 .mp3/.wav 格式。"
                    color="bg-[#64d2ff]"
                />
             </div>
          </div>
        )}

        {/* --- EDITOR VIEW (File Loaded) --- */}
        {audioBuffer && fileUrl && (
          <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 pb-4 border-b border-[#3a3a3c]/50">
                <div>
                   <span className="text-[11px] font-semibold uppercase tracking-wider text-[#007AFF]">正在编辑</span>
                   <h2 className="text-xl md:text-2xl font-bold text-white truncate max-w-[300px] md:max-w-md mt-1">
                      {file?.name}
                   </h2>
                </div>
                
                <button 
                    onClick={reset}
                    className="self-start md:self-auto group flex items-center space-x-2 bg-[#1c1c1e] active:bg-[#2c2c2e] text-[#007AFF] px-4 py-2 rounded-full transition-all font-medium text-sm"
                >
                    <UploadCloud size={16} />
                    <span>选择新文件</span>
                    <ChevronRight size={14} className="opacity-50" />
                </button>
            </div>

            <WaveformEditor 
              url={fileUrl} 
              audioBuffer={audioBuffer}
              onRegionChange={setRegion}
              selectedDuration={selectedDuration}
              settings={settings}
            />

            <Controls 
              settings={settings} 
              onChange={setSettings} 
            />
            
            <div className="h-4"></div>
          </div>
        )}
      </main>

      {audioBuffer && (
        <StickyFooter 
            onExport={handleExport} 
            isExporting={isProcessing}
            settings={settings}
            onFormatChange={(format) => setSettings(s => ({...s, format}))}
            duration={selectedDuration}
        />
      )}
    </div>
  );
}

// Sub-component for Feature Grid
const FeatureCard = ({ icon: Icon, title, desc, color }: any) => (
    <div className="bg-[#1c1c1e] p-5 rounded-2xl md:rounded-3xl hover:bg-[#2c2c2e] transition-colors duration-300">
        <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center mb-4 text-white shadow-lg shadow-black/20`}>
            <Icon size={18} strokeWidth={2.5} />
        </div>
        <h3 className="text-white font-semibold mb-2 text-[15px] md:text-base">{title}</h3>
        <p className="text-[#8e8e93] text-xs md:text-[13px] leading-relaxed">{desc}</p>
    </div>
);

export default App;