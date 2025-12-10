import React from 'react';
import { Download, Loader2, Clock, AlertTriangle } from 'lucide-react';
import { ExportFormat, ProcessingSettings } from '../types';

interface StickyFooterProps {
  onExport: () => void;
  isExporting: boolean;
  settings: ProcessingSettings;
  onFormatChange: (format: ExportFormat) => void;
  duration: number;
}

const StickyFooter: React.FC<StickyFooterProps> = ({ 
  onExport, 
  isExporting, 
  settings, 
  onFormatChange,
  duration 
}) => {
  const isIphone = settings.format === ExportFormat.M4R;
  const isOverLimit = duration > 30.5;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none">
      
      {/* Container - iOS Floating Platter */}
      <div className="pointer-events-auto bg-[#1c1c1e]/85 backdrop-blur-xl border border-[#3a3a3c]/50 rounded-[24px] p-2.5 shadow-2xl shadow-black/50 w-full max-w-xl flex items-center justify-between gap-3">
          
          {/* Duration Info (Mini) */}
          <div className="hidden sm:flex items-center gap-3 pl-3 pr-4 border-r border-[#3a3a3c]/50">
             <div className="flex flex-col items-start">
                <span className="text-[10px] font-bold text-[#8e8e93] uppercase">总时长</span>
                <span className={`text-[15px] font-mono font-medium leading-none ${isOverLimit && isIphone ? 'text-[#ff9f0a]' : 'text-white'}`}>
                   {duration.toFixed(1)}s
                </span>
             </div>
          </div>

          <div className="flex items-center gap-2 flex-1">
            {/* Format Selector - iOS Picker Look */}
            <div className="relative">
              <select
                value={settings.format}
                onChange={(e) => onFormatChange(e.target.value as ExportFormat)}
                disabled={isExporting}
                className="appearance-none bg-[#2c2c2e] text-white text-[13px] font-medium rounded-xl h-[44px] pl-4 pr-8 outline-none focus:ring-2 focus:ring-[#007AFF] transition-all cursor-pointer border-none"
              >
                <option value={ExportFormat.M4R}>iPhone (.m4r)</option>
                <option value={ExportFormat.WAV}>高品质 (.wav)</option>
                <option value={ExportFormat.MP3}>Android (.mp3)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#8e8e93]">
                <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>

            {/* Main Action Button - iOS Primary Button */}
            <button
              onClick={onExport}
              disabled={isExporting}
              className={`
                flex-1 h-[44px] rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all
                ${isExporting 
                  ? 'bg-[#2c2c2e] text-[#8e8e93] cursor-wait' 
                  : 'bg-[#007AFF] hover:bg-[#0071e3] active:scale-[0.98] shadow-lg shadow-blue-500/20'
                }
              `}
            >
              {isExporting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>导出中...</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>生成并下载</span>
                </>
              )}
            </button>
          </div>

      </div>

      {/* Floating Warning for iPhone Limit */}
      {isIphone && isOverLimit && (
        <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-[#ff9f0a]/90 backdrop-blur-md text-black px-4 py-2 rounded-full shadow-lg flex items-center gap-2 pointer-events-none whitespace-nowrap">
           <AlertTriangle size={14} fill="currentColor" />
           <span className="text-xs font-bold">建议时长 ≤ 30s</span>
        </div>
      )}

    </div>
  );
};

export default StickyFooter;