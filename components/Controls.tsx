import React from 'react';
import { Volume2, Zap, ArrowRightFromLine, ArrowLeftFromLine, Sliders, Waves, Gauge, Rewind } from 'lucide-react';
import { ProcessingSettings } from '../types';

interface ControlsProps {
  settings: ProcessingSettings;
  onChange: (newSettings: ProcessingSettings) => void;
}

const Controls: React.FC<ControlsProps> = ({ settings, onChange }) => {
  
  const update = (key: keyof ProcessingSettings, value: number | boolean) => {
    onChange({ ...settings, [key]: value });
  };

  const CardHeader = ({ icon: Icon, title, colorBg }: { icon: any, title: string, colorBg: string }) => (
    <div className="flex items-center space-x-3 mb-6">
      <div className={`w-7 h-7 rounded-md flex items-center justify-center text-white ${colorBg}`}>
         <Icon size={16} strokeWidth={2.5} />
      </div>
      <h3 className="font-semibold text-white text-[15px]">{title}</h3>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* Card 1: Time & Fades */}
      <div className="bg-[#1c1c1e] rounded-[22px] p-5 md:p-6 shadow-sm">
        <CardHeader icon={ArrowRightFromLine} title="时间与节奏" colorBg="bg-[#5e5ce6]" />
        
        <div className="space-y-7">
           {/* Fade In */}
          <div className="group">
            <div className="flex justify-between items-center mb-3">
              <label className="text-[13px] font-medium text-[#ebebf5]">淡入时长</label>
              <span className="text-[13px] font-medium text-[#98989d]">
                {settings.fadeIn}s
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={settings.fadeIn}
              onChange={(e) => update('fadeIn', parseFloat(e.target.value))}
              className="w-full accent-[#007AFF] h-1 bg-[#3a3a3c] rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Fade Out */}
          <div className="group">
            <div className="flex justify-between items-center mb-3">
              <label className="text-[13px] font-medium text-[#ebebf5]">淡出时长</label>
              <span className="text-[13px] font-medium text-[#98989d]">
                {settings.fadeOut}s
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={settings.fadeOut}
              onChange={(e) => update('fadeOut', parseFloat(e.target.value))}
              className="w-full accent-[#007AFF] h-1 bg-[#3a3a3c] rounded-lg appearance-none cursor-pointer"
            />
          </div>

           {/* Reverse Toggle - iOS Switch Style */}
           <div className="pt-2 flex items-center justify-between border-t border-[#3a3a3c] mt-4 pt-4">
              <label className="flex items-center space-x-3 text-[15px] text-white cursor-pointer">
                  <div className="w-7 h-7 rounded-md bg-[#ff2d55] flex items-center justify-center text-white">
                      <Rewind size={14} fill="currentColor" />
                  </div>
                  <span>音频倒放</span>
              </label>
              <button 
                  onClick={() => update('isReverse', !settings.isReverse)}
                  className={`
                      w-[51px] h-[31px] rounded-full p-[2px] transition-colors duration-300 ease-in-out focus:outline-none
                      ${settings.isReverse ? 'bg-[#32d74b]' : 'bg-[#3a3a3c]'}
                  `}
              >
                  <div className={`
                      w-[27px] h-[27px] bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out
                      ${settings.isReverse ? 'translate-x-5' : 'translate-x-0'}
                  `} />
              </button>
           </div>
        </div>
      </div>

      {/* Card 2: Tone & EQ */}
      <div className="bg-[#1c1c1e] rounded-[22px] p-5 md:p-6 shadow-sm">
        <CardHeader icon={Sliders} title="音色与均衡" colorBg="bg-[#32d74b]" />

        <div className="space-y-7">
          {/* Bass */}
          <div className="group">
            <div className="flex justify-between items-center mb-3">
              <label className="text-[13px] font-medium text-[#ebebf5]">低音增强 (Bass)</label>
              <span className="text-[13px] font-medium text-[#98989d]">
                {settings.bass > 0 ? '+' : ''}{settings.bass}dB
              </span>
            </div>
            <input
              type="range"
              min="-10"
              max="15"
              step="1"
              value={settings.bass}
              onChange={(e) => update('bass', parseFloat(e.target.value))}
              className="w-full accent-[#32d74b] h-1 bg-[#3a3a3c] rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Treble */}
          <div className="group">
            <div className="flex justify-between items-center mb-3">
              <label className="text-[13px] font-medium text-[#ebebf5]">高音 (Treble)</label>
              <span className="text-[13px] font-medium text-[#98989d]">
                {settings.treble > 0 ? '+' : ''}{settings.treble}dB
              </span>
            </div>
            <input
              type="range"
              min="-10"
              max="15"
              step="1"
              value={settings.treble}
              onChange={(e) => update('treble', parseFloat(e.target.value))}
              className="w-full accent-[#32d74b] h-1 bg-[#3a3a3c] rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Reverb */}
          <div className="group">
            <div className="flex justify-between items-center mb-3">
              <label className="text-[13px] font-medium text-[#ebebf5] flex items-center gap-1">
                 空间感 / 混响
              </label>
              <span className="text-[13px] font-medium text-[#98989d]">
                {(settings.reverb * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.reverb}
              onChange={(e) => update('reverb', parseFloat(e.target.value))}
              className="w-full accent-[#32d74b] h-1 bg-[#3a3a3c] rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Card 3: Mastering */}
      <div className="bg-[#1c1c1e] rounded-[22px] p-5 md:p-6 shadow-sm">
        <CardHeader icon={Gauge} title="母带处理" colorBg="bg-[#ff9f0a]" />

        <div className="space-y-7">
          {/* Volume */}
          <div className="group">
            <div className="flex justify-between items-center mb-3">
              <label className="text-[13px] font-medium text-[#ebebf5]">音量 (Volume)</label>
              <span className="text-[13px] font-medium text-[#98989d]">
                {(settings.volume * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={settings.volume}
              onChange={(e) => update('volume', parseFloat(e.target.value))}
              className="w-full accent-[#ff9f0a] h-1 bg-[#3a3a3c] rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Speed */}
          <div className="group">
            <div className="flex justify-between items-center mb-3">
              <label className="text-[13px] font-medium text-[#ebebf5]">速度 / 音调</label>
              <span className="text-[13px] font-medium text-[#98989d]">
                {settings.speed}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.speed}
              onChange={(e) => update('speed', parseFloat(e.target.value))}
              className="w-full accent-[#ff9f0a] h-1 bg-[#3a3a3c] rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-[11px] text-[#8e8e93] mt-2 leading-relaxed">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#ff9f0a] mr-1"></span>
                调节速度会同时改变音调 (0.8x=低沉, 1.2x=高亢)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Controls;