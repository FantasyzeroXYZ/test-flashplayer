import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { ShortcutConfig } from '../types';

interface ShortcutsModalProps {
  config: ShortcutConfig;
  onSave: (config: ShortcutConfig) => void;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ config, onSave, onClose }) => {
  const [tempConfig, setTempConfig] = React.useState(config);

  const handleChange = (key: keyof ShortcutConfig, value: string) => {
    setTempConfig(prev => ({ ...prev, [key]: value.toUpperCase() }));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-2 text-white">
            <Keyboard size={18} className="text-blue-500" />
            <span className="font-bold">Keyboard Shortcuts</span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
            <div className="space-y-3">
              <ShortcutRow label="Toggle Fullscreen" value={tempConfig.toggleFullscreen} onChange={(v) => handleChange('toggleFullscreen', v)} />
              <ShortcutRow label="Mute / Unmute" value={tempConfig.toggleMute} onChange={(v) => handleChange('toggleMute', v)} />
              <ShortcutRow label="Pause / Resume" value={tempConfig.pause} onChange={(v) => handleChange('pause', v)} />
              <ShortcutRow label="Boss Key (Hide UI)" value={tempConfig.bossKey} onChange={(v) => handleChange('bossKey', v)} />
            </div>
        </div>

        <div className="flex justify-end gap-3 p-5 bg-zinc-900 border-t border-zinc-800">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => { onSave(tempConfig); onClose(); }}
            className="px-6 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-900/20"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

const ShortcutRow = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
  <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
    <span className="text-zinc-300 text-sm font-medium">{label}</span>
    <input 
      type="text" 
      maxLength={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-10 h-10 text-center rounded-md border border-zinc-700 bg-zinc-800 focus:border-blue-500 focus:bg-zinc-700 outline-none font-mono text-lg font-bold text-blue-400 transition-all uppercase"
    />
  </div>
);
