import React, { useEffect, useState, useRef } from 'react';
import { X, Save, Upload, Download, Trash2, RefreshCw, HardDrive, ArrowUpCircle } from 'lucide-react';
import { RuffleSaveItem, listRuffleSaves, deleteRuffleSave, writeRuffleSave } from '../services/ruffleStorage';
import { Language } from '../types';
import { getTranslation } from '../utils/i18n';

interface SaveManagerModalProps {
  visible: boolean;
  onClose: () => void;
  currentSwfUrl: string | null;
  lang: Language;
  onReloadGame: () => void; // Trigger game reload if needed
}

export const SaveManagerModal: React.FC<SaveManagerModalProps> = ({ 
  visible, onClose, currentSwfUrl, lang, onReloadGame 
}) => {
  const [saves, setSaves] = useState<RuffleSaveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCurrentKey, setSelectedCurrentKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = getTranslation(lang);

  const loadSaves = async () => {
    setLoading(true);
    const list = await listRuffleSaves(currentSwfUrl);
    setSaves(list);
    
    // Auto-select first current save if available
    const current = list.find(s => s.isCurrentSession);
    if (current) setSelectedCurrentKey(current.key);
    
    setLoading(false);
  };

  useEffect(() => {
    if (visible) loadSaves();
  }, [visible, currentSwfUrl]);

  const handleDownload = (save: RuffleSaveItem) => {
    const blob = new Blob([save.data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${save.name || 'save'}.sol`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (key: string) => {
    if (window.confirm(t.deleteSaveConfirm)) {
      await deleteRuffleSave(key);
      loadSaves();
    }
  };

  const handleInject = async (sourceData: ArrayBuffer) => {
    if (!selectedCurrentKey) {
      alert(t.noCurrentSaves);
      return;
    }
    if (window.confirm(t.restoreConfirm)) {
       await writeRuffleSave(selectedCurrentKey, sourceData);
       alert(t.saveSuccess);
       loadSaves();
       // Optionally reload game? usually Ruffle needs reload to pick up DB changes if it caches
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedCurrentKey) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        if (ev.target?.result) {
           await handleInject(ev.target.result as ArrayBuffer);
        }
      };
      reader.readAsArrayBuffer(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!visible) return null;

  const currentSaves = saves.filter(s => s.isCurrentSession);
  const historySaves = saves.filter(s => !s.isCurrentSession);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
       <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950">
             <div className="flex items-center gap-2 text-white font-bold text-lg">
                <HardDrive className="text-blue-500" />
                {t.saveManagerTitle}
             </div>
             <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                <X size={24} />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
             
             {/* Current Session Section */}
             <div className="space-y-3">
                <div className="flex items-center justify-between">
                   <h3 className="text-sm font-bold text-green-400 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      {t.currentSession}
                   </h3>
                   <button onClick={loadSaves} className="text-xs text-zinc-500 hover:text-white flex items-center gap-1">
                      <RefreshCw size={12} /> {t.refresh}
                   </button>
                </div>

                {currentSaves.length === 0 ? (
                   <div className="p-4 bg-zinc-950/50 rounded-lg border border-zinc-800 border-dashed text-zinc-500 text-sm text-center">
                      <p className="font-medium mb-1">{t.noCurrentSaves}</p>
                      <p className="text-xs opacity-70">{t.noCurrentSavesTip}</p>
                   </div>
                ) : (
                   <div className="grid gap-2">
                      {currentSaves.map(save => (
                         <div 
                           key={save.key}
                           onClick={() => setSelectedCurrentKey(save.key)}
                           className={`p-3 rounded-lg border flex items-center justify-between transition-all cursor-pointer
                             ${selectedCurrentKey === save.key 
                               ? 'bg-blue-600/10 border-blue-500 ring-1 ring-blue-500/50' 
                               : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'
                             }
                           `}
                         >
                            <div className="flex items-center gap-3">
                               <div className="p-2 bg-zinc-900 rounded text-blue-400 font-mono text-xs font-bold">SOL</div>
                               <div>
                                  <div className="font-bold text-zinc-200">{save.name}</div>
                                  <div className="text-xs text-zinc-500">{(save.size / 1024).toFixed(2)} KB</div>
                               </div>
                            </div>
                            <div className="flex items-center gap-2">
                               <button 
                                 onClick={(e) => { e.stopPropagation(); handleDownload(save); }}
                                 className="p-2 hover:bg-zinc-600 rounded text-zinc-400 hover:text-white"
                                 title={t.backupToFile}
                               >
                                  <Download size={18} />
                               </button>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                 className="p-2 hover:bg-zinc-600 rounded text-zinc-400 hover:text-white"
                                 title={t.restoreFromFile}
                               >
                                  <Upload size={18} />
                               </button>
                            </div>
                         </div>
                      ))}
                   </div>
                )}
             </div>

             {/* History Section */}
             <div className="space-y-3">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider border-t border-zinc-800 pt-4">
                   {t.historySaves}
                </h3>
                
                {historySaves.length === 0 ? (
                   <div className="text-center text-zinc-600 text-sm py-4">{t.noHistorySaves}</div>
                ) : (
                   <div className="grid gap-2">
                      {historySaves.map(save => (
                         <div key={save.key} className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg flex items-center justify-between hover:border-zinc-700 transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden">
                               <div className="p-2 bg-zinc-950 rounded text-zinc-500 font-mono text-xs">OLD</div>
                               <div className="min-w-0">
                                  <div className="font-medium text-zinc-300 truncate text-sm" title={save.key}>{save.name}</div>
                                  <div className="text-xs text-zinc-600 truncate max-w-[200px]">{save.key.split('/blob:')[0] || t.unknownGame}</div>
                               </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                               <button 
                                 onClick={() => handleInject(save.data)}
                                 disabled={!selectedCurrentKey}
                                 className={`p-1.5 rounded flex items-center gap-1 text-xs font-medium transition-colors
                                    ${selectedCurrentKey 
                                       ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white' 
                                       : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                    }
                                 `}
                                 title={t.injectTip}
                               >
                                  <ArrowUpCircle size={14} />
                                  <span className="hidden sm:inline">{t.restoreFromHistory}</span>
                               </button>
                               <button 
                                 onClick={() => handleDownload(save)}
                                 className="p-2 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300"
                               >
                                  <Download size={16} />
                               </button>
                               <button 
                                 onClick={() => handleDelete(save.key)}
                                 className="p-2 hover:bg-red-900/20 rounded text-zinc-600 hover:text-red-400"
                               >
                                  <Trash2 size={16} />
                               </button>
                            </div>
                         </div>
                      ))}
                   </div>
                )}
             </div>
          </div>

          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".sol" className="hidden" />
       </div>
    </div>
  );
};