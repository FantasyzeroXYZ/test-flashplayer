import React, { useState, useRef, useEffect } from 'react';

interface ScreenCropperProps {
  onCrop: (rect: { x: number, y: number, width: number, height: number }) => void;
  onCancel: () => void;
}

export const ScreenCropper: React.FC<ScreenCropperProps> = ({ onCrop, onCancel }) => {
  const [startPos, setStartPos] = useState<{ x: number, y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number, y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onCancel]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setCurrentPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setCurrentPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && startPos && currentPos) {
      setIsDragging(false);
      const x = Math.min(startPos.x, currentPos.x);
      const y = Math.min(startPos.y, currentPos.y);
      const width = Math.abs(currentPos.x - startPos.x);
      const height = Math.abs(currentPos.y - startPos.y);

      if (width > 5 && height > 5) {
        onCrop({ x, y, width, height });
      } else {
        onCancel(); // Too small, cancel
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] cursor-crosshair select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
      
      {startPos && currentPos && (
        <div 
          className="absolute border-2 border-white bg-white/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
          style={{
            left: Math.min(startPos.x, currentPos.x),
            top: Math.min(startPos.y, currentPos.y),
            width: Math.abs(currentPos.x - startPos.x),
            height: Math.abs(currentPos.y - startPos.y),
          }}
        />
      )}
      
      {!isDragging && !startPos && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full pointer-events-none">
          Click and drag to select text area (ESC to cancel)
        </div>
      )}
    </div>
  );
};
