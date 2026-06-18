import React from 'react';

interface VisualKeybinderProps {
  onKeySelect: (key: string) => void;
  remappedKeys?: string[]; // Array of physical keys that have mappings
}

const ROWS = [
  ['Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
  ['CapsLock', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter'],
  ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'ShiftRight'],
  ['Control', 'Alt', 'Space', 'AltRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight']
];

export const VisualKeybinder: React.FC<VisualKeybinderProps> = ({ onKeySelect, remappedKeys = [] }) => {
  return (
    <div className="w-full bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col gap-1.5 select-none">
       {ROWS.map((row, rIndex) => (
          <div key={rIndex} className="flex gap-1.5 justify-center">
             {row.map((key, kIndex) => {
                let widthClass = "w-8";
                if (key === 'Space') widthClass = "w-48";
                else if (['Backspace', 'Enter', 'Shift', 'ShiftRight', 'CapsLock', 'Tab'].includes(key)) widthClass = "w-16 px-2";
                else if (['Control', 'Alt', 'AltRight'].includes(key)) widthClass = "w-12";
                
                const displayKey = key.replace('Arrow', '').replace('Right', ' R');
                const isRemapped = remappedKeys.includes(key) || (key.startsWith('Key') && remappedKeys.includes(key));

                // If key is 'Q', checking remappedKeys for 'KeyQ' might be needed if format differs, 
                // but usually we standardise on code (KeyQ) or key (q).
                // Let's assume code format for robustness in parent, but display logic here needs to match.
                // Simple matching for now based on display key or exact code.
                // For this visualizer, let's pass exact codes if possible. 
                // The ROWS array uses a mix of codes and names. Let's normalize slightly for checking.
                
                // Helper to normalize for check
                const checkKey = key.length === 1 ? `Key${key.toUpperCase()}` : key;
                const active = remappedKeys.includes(checkKey) || remappedKeys.includes(key);

                return (
                   <button
                     key={`${rIndex}-${kIndex}`}
                     onClick={(e) => { e.stopPropagation(); onKeySelect(key); }}
                     className={`
                       h-8 ${widthClass} rounded text-[10px] font-bold transition-all
                       border-b-2 active:border-b-0 active:translate-y-[2px]
                       flex items-center justify-center
                       ${active 
                         ? 'bg-blue-600 text-white border-blue-800 shadow-[0_0_10px_rgba(37,99,235,0.3)]' 
                         : 'bg-zinc-800 text-zinc-300 border-zinc-900 hover:bg-zinc-700 hover:text-white'
                       }
                     `}
                   >
                     {displayKey}
                   </button>
                );
             })}
          </div>
       ))}
    </div>
  );
};