import React, { useState } from 'react';
import { RefreshCw, Maximize, Volume2, VolumeX, Gamepad2, MousePointer2, ScanText, Save, Camera, Pause, Play, BookA, Gauge, Plus, Minus } from 'lucide-react';
import { getTranslation } from '../utils/i18n';
import { Language } from '../types';

interface GameToolbarProps {
  onReset: () => void;
  onToggleFullscreen: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  showGamepad: boolean;
  onToggleGamepad: () => void;
  onStartOCR: () => void;
  onSaveGame: () => void;
  onScreenshot: () => void;
  onTogglePause: () => void;
  onOpenDictionary: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  lang: Language;
}

export const GameToolbar: React.FC<GameToolbarProps> = ({
  onReset,
  onToggleFullscreen,
  isMuted,
  onToggleMute,
  showGamepad,
  onToggleGamepad,
  onStartOCR,
  onSaveGame,
  onScreenshot,
  onTogglePause,
  onOpenDictionary,
  speed,
  onSpeedChange,
  lang
}) => {
  const t = getTranslation(lang);
  const [isPaused, setIsPaused] = useState(false);
  const [showSpeed, setShowSpeed] = useState(false);

  const handlePause = () => {
    setIsPaused(!isPaused);
    onTogglePause();
  };

  const handleSpeed = (delta: number) => {
      let newSpeed = speed + delta;
      if (newSpeed < 0.5) newSpeed = 0.5;
      if (newSpeed > 3.0) newSpeed = 3.0;
      onSpeedChange(parseFloat(newSpeed.toFixed(1)));
  };

  return (
    <div className="flex items-center justify-center p-2">
      <div className="flex items-center gap-1 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 rounded-2xl shadow-xl px-2 py-1.5">
        
        <ToolButton onClick={onReset} icon={<RefreshCw size={18} />} label={t.resetGame} />
        <ToolButton onClick={handlePause} icon={isPaused ? <Play size={18}/> : <Pause size={18} />} label={isPaused ? t.resumeGame : t.pauseGame} />
        
        {/* Speed Control */}
        <div className="relative group flex items-center">
            <ToolButton onClick={() => setShowSpeed(!showSpeed)} icon={<Gauge size={18} />} label={t.speed} active={speed !== 1} />
            {(showSpeed || speed !== 1) && (
                <div className="flex items-center gap-1 bg-zinc-800 rounded-lg px-1 ml-1 animate-fade-in border border-zinc-700">
                    <button onClick={() => handleSpeed(-0.5)} className="p-1 hover:text-white text-zinc-400"><Minus size={12} /></button>
                    <span className="text-[10px] w-8 text-center font-mono font-bold text-blue-400">{speed}x</span>
                    <button onClick={() => handleSpeed(0.5)} className="p-1 hover:text-white text-zinc-400"><Plus size={12} /></button>
                </div>
            )}
        </div>

        <div className="w-px h-6 bg-zinc-700 mx-1"></div>
        
        <ToolButton onClick={onToggleMute} icon={isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />} label={t.mute} />
        <ToolButton onClick={onToggleFullscreen} icon={<Maximize size={18} />} label={t.fullscreen} />
        
        <div className="w-px h-6 bg-zinc-700 mx-1"></div>

        <ToolButton 
           onClick={onToggleGamepad} 
           icon={showGamepad ? <MousePointer2 size={18} /> : <Gamepad2 size={18} />} 
           label={t.gamepad} 
           active={showGamepad}
           highlight
         />
         
        <div className="w-px h-6 bg-zinc-700 mx-1"></div>

         <ToolButton 
           onClick={onScreenshot} 
           icon={<Camera size={18} />} 
           label={t.screenshot}
         />

         <ToolButton 
           onClick={onSaveGame} 
           icon={<Save size={18} />} 
           label={t.saveGame}
         />

         <ToolButton 
           onClick={onStartOCR} 
           icon={<ScanText size={18} />} 
           label={t.startOcr}
         />

         <ToolButton 
           onClick={onOpenDictionary} 
           icon={<BookA size={18} />} 
           label={t.dictionary}
         />
      </div>
    </div>
  );
};

const ToolButton = ({ onClick, icon, label, active = false, highlight = false }: { onClick: () => void, icon: any, label: string, active?: boolean, highlight?: boolean }) => (
  <button 
    onClick={onClick}
    className={`
      flex items-center justify-center p-2 rounded-xl transition-all duration-200
      ${active || highlight && active
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-105' 
        : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50 active:scale-95'
      }
    `}
    title={label}
  >
    {icon}
  </button>
);