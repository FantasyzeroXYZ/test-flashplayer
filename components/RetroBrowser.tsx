import React from 'react';
import { ArrowLeft, ArrowRight, RefreshCw, X, Minus, Square, Search, Home, ShieldCheck } from 'lucide-react';

interface RetroBrowserProps {
  children: React.ReactNode;
  url: string;
}

export const RetroBrowser: React.FC<RetroBrowserProps> = ({ children, url }) => {
  return (
    <div className="flex flex-col w-full h-full bg-[#ECE9D8] border border-[#0054E3] rounded-t-lg shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden">
      
      {/* XP Title Bar */}
      <div className="flex justify-between items-center px-2 py-1.5 bg-gradient-to-b from-[#245EDC] via-[#3E80F3] to-[#245EDC] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] select-none cursor-default rounded-t-md">
        <div className="flex items-center gap-2 pl-1">
          <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
             <span className="text-[#245EDC] font-serif font-bold italic text-[10px]">e</span>
          </div>
          <span className="text-white text-[13px] font-bold font-sans tracking-wide text-shadow-sm">Internet Explorer - [FlashGen Simulator]</span>
        </div>
        <div className="flex gap-1">
          <WindowControl icon={<Minus size={10} strokeWidth={4} />} label="Minimize" />
          <WindowControl icon={<Square size={9} strokeWidth={3} />} label="Maximize" />
          <WindowControl icon={<X size={12} strokeWidth={3} />} isClose label="Close" />
        </div>
      </div>

      {/* Menu Bar */}
      <div className="flex px-1 py-1 bg-[#ECE9D8] text-[11px] border-b border-[#D2D0C5] shadow-[0_1px_0_white]">
        {['File', 'Edit', 'View', 'Favorites', 'Tools', 'Help'].map((item) => (
          <span key={item} className="px-2 py-0.5 hover:bg-[#316AC5] hover:text-white cursor-default rounded-sm transition-colors">
            {item}
          </span>
        ))}
        <div className="flex-1"></div>
        <div className="bg-windows-logo w-4 h-4 opacity-50"></div>
      </div>

      {/* Navigation Toolbar */}
      <div className="flex items-center gap-1 p-1 bg-[#ECE9D8] border-b border-[#D2D0C5] shadow-[inset_0_-1px_0_#fff]">
        <div className="flex gap-0.5">
          <NavButton icon={<ArrowLeft size={18} />} label="Back" rounded="l" />
          <NavButton icon={<ArrowRight size={18} />} rounded="r" />
        </div>
        
        <NavButton icon={<RefreshCw size={15} />} />
        <NavButton icon={<Home size={16} />} />
        
        <div className="w-[1px] h-6 bg-[#ACA899] mx-1 shadow-[1px_0_0_white]"></div>
        
        <div className="flex-1 h-6 bg-white border border-[#7F9DB9] flex items-center px-1 shadow-inner relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-1 pointer-events-none">
             <img src="https://picsum.photos/16/16?random=99" className="w-3.5 h-3.5 opacity-60 grayscale" alt="" />
          </div>
          <span className="pl-6 text-[11px] text-[#444] font-sans truncate w-full select-all cursor-text font-medium">{url}</span>
        </div>
        
        <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-b from-[#3C8828] to-[#206910] border border-[#16480B] rounded-[3px] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] cursor-pointer active:translate-y-[1px]">
           <span className="text-white text-[11px] font-bold drop-shadow-md pr-1">Go</span>
           <ArrowRight size={10} className="text-white" />
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 bg-black relative border-t border-[#888] shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
        {children}
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-[#ECE9D8] border-t border-[#ACA899] flex items-center px-2 text-[11px] gap-2 select-none font-sans text-[#333]">
         <div className="flex items-center gap-1.5 flex-1">
             <div className="w-3.5 h-3.5 bg-white border border-[#999] rounded-sm flex items-center justify-center text-[#245EDC] font-bold text-[9px]">e</div>
             <span>Done</span>
         </div>
         <div className="w-[1px] h-4 bg-[#ACA899] shadow-[1px_0_0_white] mx-1"></div>
         <div className="flex items-center gap-1">
             <ShieldCheck size={12} className="text-[#333]" />
             <span>Local Intranet</span>
         </div>
      </div>
    </div>
  );
};

const WindowControl = ({ icon, isClose = false, label }: { icon: React.ReactNode, isClose?: boolean, label: string }) => (
  <button 
    className={`
      w-5 h-5 flex items-center justify-center rounded-[3px] border 
      ${isClose 
        ? 'bg-gradient-to-b from-[#E06B65] to-[#D03831] border-white shadow-[0_0_1px_#000] hover:from-[#E98D88]' 
        : 'bg-gradient-to-b from-[#FFF] to-[#C9C9D9] border-white/60 shadow-[0_0_1px_#000] text-[#444] hover:brightness-110'
      } 
      active:brightness-95 active:shadow-inner focus:outline-none transition-all
    `}
    title={label}
  >
    <div className={isClose ? 'text-white drop-shadow-md' : 'opacity-70'}>
      {icon}
    </div>
  </button>
);

const NavButton = ({ icon, label, rounded }: { icon: React.ReactNode, label?: string, rounded?: 'l' | 'r' }) => (
  <button className={`
    flex items-center gap-1 px-1.5 py-1 
    ${rounded === 'l' ? 'rounded-l-[3px]' : rounded === 'r' ? 'rounded-r-[3px]' : 'rounded-[3px]'}
    hover:bg-gradient-to-b hover:from-[#FBF8F2] hover:to-[#EBE7D6] hover:shadow-[0_1px_2px_rgba(0,0,0,0.2)]
    active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] active:bg-[#DAD6C6]
    border border-transparent hover:border-[#ACA899]
    text-[#333] transition-all
  `}>
    <div className="drop-shadow-sm">{icon}</div>
    {label && <span className="text-[11px] hidden sm:block font-medium">{label}</span>}
  </button>
);
