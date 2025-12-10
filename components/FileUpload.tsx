import React, { useCallback, useRef } from 'react';
import { Upload, Music, Video, FileAudio, ArrowUpRight } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (isProcessing) return;
      
      const file = e.dataTransfer.files[0];
      if (file && (file.type.startsWith('audio/') || file.type.startsWith('video/'))) {
        onFileSelect(file);
      }
    },
    [onFileSelect, isProcessing]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    if (!isProcessing && inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div
      onClick={triggerFileSelect}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`
        relative group cursor-pointer
        bg-[#1c1c1e] hover:bg-[#2c2c2e]
        rounded-[24px] overflow-hidden transition-all duration-300
        ${isProcessing ? 'opacity-70 cursor-wait' : 'hover:scale-[1.01] active:scale-[0.99]'}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/*,video/*"
        onChange={handleChange}
        disabled={isProcessing}
        className="hidden"
      />

      <div className="relative z-10 p-8 md:p-12 flex flex-col items-center justify-center text-center h-full min-h-[260px]">
        
        {/* iOS Style Icon Container */}
        <div className="relative mb-6">
            <div className="w-20 h-20 rounded-2xl bg-[#007AFF] shadow-xl shadow-blue-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                {isProcessing ? (
                   <LoaderAnimation />
                ) : (
                   <Upload size={36} className="text-white" />
                )}
            </div>
        </div>

        <h3 className="text-2xl font-bold text-white mb-2">
            {isProcessing ? '处理中...' : '上传视频或音频'}
        </h3>
        
        <p className="text-[15px] text-[#8e8e93] max-w-xs leading-relaxed">
            轻触浏览或将文件拖放至此 <br/>
            支持 <span className="text-[#ebebf5] font-medium">MP4, MOV, MP3</span>
        </p>

        {/* Fake iOS Button */}
        <div className="mt-8 flex items-center gap-2 text-[13px] font-semibold text-[#007AFF] bg-[#007AFF]/10 px-5 py-2.5 rounded-full group-hover:bg-[#007AFF]/20 transition-colors">
            <span>浏览文件</span>
            <ArrowUpRight size={14} strokeWidth={3} />
        </div>
      </div>
    </div>
  );
};

const LoaderAnimation = () => (
  <div className="flex gap-1.5 h-8 items-center">
    <div className="w-1.5 bg-white h-3 animate-[wave_1s_ease-in-out_infinite] rounded-full"></div>
    <div className="w-1.5 bg-white h-6 animate-[wave_1s_ease-in-out_0.1s_infinite] rounded-full"></div>
    <div className="w-1.5 bg-white h-3 animate-[wave_1s_ease-in-out_0.2s_infinite] rounded-full"></div>
  </div>
);

export default FileUpload;