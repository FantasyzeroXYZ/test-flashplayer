import React, { useState, useCallback } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { KeyMap } from '../types';

interface VirtualGamepadProps {
  visible: boolean;
  keyMap: KeyMap;
  opacity: number;
}

// Helper to get legacy keyCode
const getKeyCode = (key: string): number => {
  if (!key) return 0;
  const k = key.toUpperCase();
  switch (k) {
    case 'ENTER': return 13;
    case 'SPACE': return 32;
    case 'ARROWUP': return 38;
    case 'ARROWDOWN': return 40;
    case 'ARROWLEFT': return 37;
    case 'ARROWRIGHT': return 39;
    case 'SHIFT': return 16;
    case 'CONTROL': return 17;
    case 'ALT': return 18;
    case 'ESCAPE': return 27;
    case 'W': return 87;
    case 'A': return 65;
    case 'S': return 83;
    case 'D': return 68;
    default: return k.length === 1 ? k.charCodeAt(0) : 0;
  }
};

const getCode = (key: string): string => {
    if (!key) return '';
    const k = key.toUpperCase();
    if (k.startsWith('ARROW')) return k.charAt(0) + k.slice(1).toLowerCase(); 
    if (k === 'SPACE') return 'Space';
    if (k === 'ENTER') return 'Enter';
    if (k.length === 1) return `Key${k}`;
    return key;
};

interface GameButtonProps {
  icon?: any;
  label?: string;
  actionKey: string;
  className: string;
  style?: React.CSSProperties;
  simulateKey: (key: string, type: 'keydown' | 'keyup') => void;
  subLabel?: string;
}

const GameButton: React.FC<GameButtonProps> = ({ 
  icon: Icon, 
  label, 
  actionKey, 
  className, 
  style, 
  simulateKey,
  subLabel
}) => {
  const [isPressed, setIsPressed] = useState(false);

  // If no key mapped, don't render
  if (!actionKey) return null;

  // Robust handler for pressing down
  const handleDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    if (isPressed) return; 

    setIsPressed(true);
    simulateKey(actionKey, 'keydown');

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {}
  }, [isPressed, actionKey, simulateKey]);

  // Robust handler for releasing
  const handleUp = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isPressed) return; 

    setIsPressed(false);
    simulateKey(actionKey, 'keyup');

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}
  }, [isPressed, actionKey, simulateKey]);

  return (
    <button
      className={`${className} ${isPressed ? 'scale-95 brightness-150' : ''} flex flex-col items-center justify-center touch-none select-none`}
      style={style}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerCancel={handleUp} 
      onPointerLeave={handleUp} 
    >
      {Icon && <Icon size={20} strokeWidth={2.5} />}
      {label && <span className="text-xl font-bold">{label}</span>}
      {subLabel && <span className="text-[9px] opacity-70 uppercase font-mono mt-0.5">{subLabel}</span>}
    </button>
  );
};

export const VirtualGamepad: React.FC<VirtualGamepadProps> = ({ visible, keyMap, opacity }) => {
  if (!visible) return null;

  const simulateKey = (key: string, type: 'keydown' | 'keyup') => {
    if (!key) return;
    const keyCode = getKeyCode(key);
    const code = getCode(key);
    const eventInit: KeyboardEventInit = {
      key: key === ' ' ? 'Space' : key,
      code: code,
      bubbles: true,
      cancelable: true,
      view: window,
      // @ts-ignore
      keyCode: keyCode,
      which: keyCode,
    };
    const event = new KeyboardEvent(type, eventInit);
    Object.defineProperty(event, 'keyCode', { get: () => keyCode });
    Object.defineProperty(event, 'which', { get: () => keyCode });
    window.dispatchEvent(event);
    
    const rufflePlayer = document.querySelector('ruffle-player') || document.querySelector('embed') || document.querySelector('object');
    if (rufflePlayer) rufflePlayer.dispatchEvent(event);
  };

  const btnBase = "backdrop-blur-sm border transition-all touch-none select-none shadow-lg outline-none active:bg-white/20";
  const dPadStyle = { backgroundColor: `rgba(39, 39, 42, ${opacity})` };
  const dPadClass = `${btnBase} w-12 h-12 rounded-lg text-white border-white/10`;
  const actionBtnClass = `${btnBase} w-14 h-14 rounded-full text-white border-white/5`;
  const shoulderBtnClass = `${btnBase} w-20 h-10 rounded-full text-white border-white/10 text-xs font-bold bg-zinc-800/80`;
  const menuBtnClass = `${btnBase} w-12 h-8 rounded-full text-white border-white/10 text-[10px] bg-zinc-900/80`;

  return (
    <div className="absolute inset-0 z-40 pointer-events-none flex flex-col justify-between p-4 sm:p-8 select-none touch-none">
      
      {/* Top Row: Shoulders */}
      <div className="pointer-events-auto flex justify-between w-full max-w-5xl mx-auto px-2">
         <div className="flex flex-col gap-2">
            <GameButton label="L2" actionKey={keyMap.l2} className={shoulderBtnClass} style={{opacity}} simulateKey={simulateKey} />
            <GameButton label="L1" actionKey={keyMap.l1} className={shoulderBtnClass} style={{opacity}} simulateKey={simulateKey} />
         </div>
         <div className="flex flex-col gap-2 items-end">
            <GameButton label="R2" actionKey={keyMap.r2} className={shoulderBtnClass} style={{opacity}} simulateKey={simulateKey} />
            <GameButton label="R1" actionKey={keyMap.r1} className={shoulderBtnClass} style={{opacity}} simulateKey={simulateKey} />
         </div>
      </div>

      <div className="flex-1"></div>

      {/* Main Controls */}
      <div className="pointer-events-auto flex justify-between items-end w-full max-w-5xl mx-auto">
        
        {/* Left: D-Pad + Analog Click */}
        <div className="flex flex-col items-center gap-1">
          <GameButton icon={ArrowUp} actionKey={keyMap.up} className={dPadClass} style={dPadStyle} simulateKey={simulateKey} />
          <div className="flex gap-1">
            <GameButton icon={ArrowLeft} actionKey={keyMap.left} className={dPadClass} style={dPadStyle} simulateKey={simulateKey} />
            <div className="w-12 h-12 flex items-center justify-center">
               <GameButton label="L3" actionKey={keyMap.l3} className="w-10 h-10 rounded-full bg-black/50 text-white text-[10px] border border-white/20" style={{opacity}} simulateKey={simulateKey} />
            </div> 
            <GameButton icon={ArrowRight} actionKey={keyMap.right} className={dPadClass} style={dPadStyle} simulateKey={simulateKey} />
          </div>
          <GameButton icon={ArrowDown} actionKey={keyMap.down} className={dPadClass} style={dPadStyle} simulateKey={simulateKey} />
        </div>

        {/* Center: Select / Start */}
        <div className="flex gap-4 pb-2">
            <GameButton label="SELECT" actionKey={keyMap.select} className={menuBtnClass} style={{opacity}} simulateKey={simulateKey} />
            <GameButton label="START" actionKey={keyMap.start} className={menuBtnClass} style={{opacity}} simulateKey={simulateKey} />
        </div>

        {/* Right: Face Buttons - Symmetrical Diamond Layout */}
        <div className="relative w-44 h-44">
           {/* Center Point - R3 */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <GameButton label="R3" actionKey={keyMap.r3} className="w-10 h-10 rounded-full bg-black/50 text-white text-[10px] border border-white/20" style={{opacity}} simulateKey={simulateKey} />
           </div>

           {/* A (Bottom) */}
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
               <GameButton label="A" subLabel="Cross" actionKey={keyMap.a} className={`${actionBtnClass} bg-blue-600/60`} style={{ opacity }} simulateKey={simulateKey} />
           </div>
           
           {/* B (Right) */}
           <div className="absolute right-0 top-1/2 -translate-y-1/2">
               <GameButton label="B" subLabel="Circle" actionKey={keyMap.b} className={`${actionBtnClass} bg-red-600/60`} style={{ opacity }} simulateKey={simulateKey} />
           </div>
           
           {/* X (Left) */}
           <div className="absolute left-0 top-1/2 -translate-y-1/2">
               <GameButton label="X" subLabel="Square" actionKey={keyMap.x} className={`${actionBtnClass} bg-pink-600/60`} style={{ opacity }} simulateKey={simulateKey} />
           </div>
           
           {/* Y (Top) */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2">
               <GameButton label="Y" subLabel="Triangle" actionKey={keyMap.y} className={`${actionBtnClass} bg-green-600/60`} style={{ opacity }} simulateKey={simulateKey} />
           </div>
        </div>

      </div>
    </div>
  );
};