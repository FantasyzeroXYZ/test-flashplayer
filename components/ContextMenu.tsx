import React from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  visible: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
  quality: string;
  isPlaying: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ 
  x, y, visible, onClose, onAction, quality, isPlaying 
}) => {
  if (!visible) return null;

  const menuItems = [
    { label: 'Zoom In', action: 'zoom_in' },
    { label: 'Zoom Out', action: 'zoom_out' },
    { label: 'Show All', action: 'show_all' },
    { type: 'separator' },
    { label: `Quality: ${quality}`, action: 'toggle_quality' },
    { label: isPlaying ? 'Stop' : 'Play', action: 'toggle_play' },
    { label: 'Loop', action: 'toggle_loop', checked: true },
    { type: 'separator' },
    { label: 'About FlashGen Player 8...', action: 'about' },
  ];

  return (
    <>
      {/* Invisible backdrop to close menu on click outside */}
      <div 
        className="fixed inset-0 z-50" 
        onClick={onClose} 
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />
      
      <div 
        className="fixed z-50 bg-[#f0f0f0] border border-[#999] shadow-[2px_2px_5px_rgba(0,0,0,0.3)] text-[11px] text-black py-1 w-48 select-none cursor-default font-sans"
        style={{ top: y, left: x }}
      >
        {menuItems.map((item, index) => {
          if (item.type === 'separator') {
            return <div key={index} className="h-[1px] bg-[#ccc] my-1 mx-1" />;
          }
          return (
            <div
              key={index}
              className="px-4 py-1 hover:bg-[#316ac5] hover:text-white flex justify-between items-center group"
              onClick={() => {
                if (item.action) onAction(item.action);
                onClose();
              }}
            >
              <span>{item.label}</span>
              {item.checked && <span className="text-[9px] text-black group-hover:text-white">●</span>}
            </div>
          );
        })}
      </div>
    </>
  );
};
