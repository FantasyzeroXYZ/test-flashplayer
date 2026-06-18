import React, { useState, useEffect } from 'react';
import { X, Keyboard, Zap, Trash2, MousePointer2, Gamepad2, Check, RotateCcw } from 'lucide-react';
import { VisualKeybinder } from './VisualKeybinder';
import { APP_FUNCTIONS, Language, MOUSE_FUNCTIONS } from '../types';
import { getTranslation } from '../utils/i18n';

interface RemapModalProps {
  sourceKey: string;
  onClose: () => void;
  onRemapKey: (targetKey: string) => void;
  onRemapFunction: (funcId: string) => void;
  onRemapMouse: (mouseAction: string) => void;
  onClear: () => void;
  lang: Language;
}

export const RemapModal: React.FC<RemapModalProps> = ({ 
  sourceKey, onClose, onRemapKey, onRemapFunction, onRemapMouse, onClear, lang 
}) => {
  const t = getTranslation(lang);
  const [mode, setMode] = useState<'visual' | 'listen'>('visual');
  const [manualTab, setManualTab] = useState<'key' | 'mouse' | 'func'>('key');
  const [detectedInput, setDetectedInput] = useState<string | null>(null);
  
  const displaySource = sourceKey.replace('Key', '').replace('Arrow', '');

  // Listen Mode Logic
  useEffect(() => {
    if (mode === 'listen') {
      const handleKeyDown = (e: KeyboardEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDetectedInput(e.code);
      };

      const handleGamepad = () => {
         const gps = navigator.getGamepads();
         if (!gps) return;
         for (const gp of gps) {
             if (gp) {
                 gp.buttons.forEach((btn, idx) => {
                     if (btn.pressed) {
                         // Gamepad binding support could be added here if we expanded the type system
                         // For now, we focus on mapping TO keys/functions. 
                         // If user presses a key on keyboard, we bind that.
                     }
                 })
             }
         }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      // const interval = setInterval(handleGamepad, 100);
      
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          // clearInterval(interval);
      };
    } else {
        setDetectedInput(null);
    }
  }, [mode]);

  const confirmBind = () => {
      if (detectedInput) {
          onRemapKey(detectedInput);
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
           <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-blue-600 text-white font-mono font-bold rounded text-lg">{displaySource}</div>
              <span className="text-zinc-400 font-bold">{t.remapTargetInstruction}</span>
           </div>
           <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={24} /></button>
        </div>

        {/* Mode Toggles */}
        <div className="flex border-b border-zinc-800 bg-zinc-900">
            <button 
                onClick={() => setMode('visual')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all
                    ${mode === 'visual' ? 'border-blue-500 text-white bg-zinc-800' : 'border-transparent text-zinc-500 hover:text-zinc-300'}
                `}
            >
                <Keyboard size={16} /> {t.manualSelect}
            </button>
            <button 
                onClick={() => setMode('listen')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all
                    ${mode === 'listen' ? 'border-blue-500 text-white bg-zinc-800' : 'border-transparent text-zinc-500 hover:text-zinc-300'}
                `}
            >
                <Gamepad2 size={16} /> {t.listenInput}
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 min-h-[400px]">
           
           {mode === 'visual' ? (
               <div className="space-y-4">
                   {/* Manual Tabs */}
                   <div className="flex gap-2 mb-4">
                       <TabButton active={manualTab === 'key'} onClick={() => setManualTab('key')} label={t.tabKeyboard} icon={<Keyboard size={14}/>} />
                       <TabButton active={manualTab === 'mouse'} onClick={() => setManualTab('mouse')} label={t.tabMouse} icon={<MousePointer2 size={14}/>} />
                       <TabButton active={manualTab === 'func'} onClick={() => setManualTab('func')} label={t.tabFunction} icon={<Zap size={14}/>} />
                   </div>

                   {manualTab === 'key' && (
                       <VisualKeybinder onKeySelect={(key) => {
                            onRemapKey(key.length === 1 ? `Key${key.toUpperCase()}` : key);
                            onClose();
                        }} />
                   )}

                   {manualTab === 'mouse' && (
                       <div className="grid grid-cols-2 gap-3">
                            {Object.entries(MOUSE_FUNCTIONS).map(([id, labelKey]) => (
                                <button
                                key={id}
                                onClick={() => { onRemapMouse(id); onClose(); }}
                                className="p-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-left transition-all hover:border-purple-500/50 group flex items-center gap-3"
                                >
                                <MousePointer2 size={24} className="text-zinc-500 group-hover:text-purple-400" />
                                <div className="text-sm font-bold text-zinc-300 group-hover:text-white">{t[`mouse_${id.toLowerCase().replace('mouse_','')}` as keyof typeof t] || labelKey}</div>
                                </button>
                            ))}
                       </div>
                   )}

                   {manualTab === 'func' && (
                       <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {Object.entries(APP_FUNCTIONS).map(([id, translationKey]) => (
                                <button
                                key={id}
                                onClick={() => { onRemapFunction(id); onClose(); }}
                                className="p-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-left transition-all hover:border-yellow-500/50 group"
                                >
                                <div className="text-xs font-bold text-zinc-300 group-hover:text-white">{t[`func_${translationKey}` as keyof typeof t] || translationKey}</div>
                                <div className="text-[10px] text-zinc-500 font-mono mt-1">{translationKey}</div>
                                </button>
                            ))}
                       </div>
                   )}
               </div>
           ) : (
               /* Listen Mode */
               <div className="h-full flex flex-col items-center justify-center gap-6">
                   {!detectedInput ? (
                       <div className="flex flex-col items-center gap-4 animate-pulse">
                           <div className="w-20 h-20 rounded-full border-4 border-zinc-700 flex items-center justify-center">
                               <Keyboard size={40} className="text-zinc-500" />
                           </div>
                           <p className="text-zinc-400 font-medium text-lg">{t.pressToBindInfo}</p>
                       </div>
                   ) : (
                       <div className="flex flex-col items-center gap-6 animate-fade-in">
                           <div className="text-zinc-500 text-sm uppercase font-bold tracking-wider">{t.detectedInput}</div>
                           <div className="text-5xl font-mono font-bold text-blue-400 bg-zinc-950 px-8 py-4 rounded-xl border border-blue-500/30 shadow-lg shadow-blue-500/10">
                               {detectedInput.replace('Key', '')}
                           </div>
                           <div className="flex gap-4 mt-4">
                               <button 
                                 onClick={() => setDetectedInput(null)} 
                                 className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold flex items-center gap-2 transition-colors"
                               >
                                   <RotateCcw size={18}/> {t.retryDetect}
                               </button>
                               <button 
                                 onClick={confirmBind} 
                                 className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-900/30 transition-all active:scale-95"
                               >
                                   <Check size={18}/> {t.confirmBind}
                               </button>
                           </div>
                       </div>
                   )}
               </div>
           )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex justify-between">
           <button 
             onClick={() => { onClear(); onClose(); }}
             className="px-4 py-2 bg-red-900/20 text-red-400 hover:bg-red-900/40 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
           >
              <Trash2 size={16} /> {t.clearRemap}
           </button>
           <button onClick={onClose} className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium">
              {t.cancel}
           </button>
        </div>

      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, label, icon }: any) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${active ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
    >
        {icon} {label}
    </button>
);