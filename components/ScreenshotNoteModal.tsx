import React, { useState } from 'react';
import { X, Download, Plus, Check, AlertCircle, Save, Image as ImageIcon } from 'lucide-react';
import { AppSettings, Language, FlashNote } from '../types';
import { getTranslation } from '../utils/i18n';
import { addNote } from '../services/ankiService';

interface ScreenshotNoteModalProps {
  imageSrc: string | null;
  onClose: () => void;
  settings: AppSettings;
  onSaveToList: (note: Omit<FlashNote, 'id'>) => void;
  onSetCover?: (image: string) => void;
}

const COLORS = ['#ef4444', '#eab308', '#3b82f6', '#22c55e', '#a855f7']; // Red, Yellow, Blue, Green, Purple

export const ScreenshotNoteModal: React.FC<ScreenshotNoteModalProps> = ({ imageSrc, onClose, settings, onSaveToList, onSetCover }) => {
  if (!imageSrc) return null;

  const t = getTranslation(settings.language);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [tags, setTags] = useState('');
  const [ankiStatus, setAnkiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [coverStatus, setCoverStatus] = useState(false);

  const handleExportImage = () => {
    const a = document.createElement('a');
    a.href = imageSrc;
    a.download = `screenshot_${Date.now()}.png`;
    a.click();
  };

  const handleExportNote = () => {
    const data = {
      title: title || 'Untitled',
      note,
      timestamp: Date.now(),
      color: selectedColor
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `note_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveToLibrary = () => {
    onSaveToList({
      title: title || 'Untitled',
      content: note,
      timestamp: Date.now(),
      imageData: imageSrc,
      color: selectedColor,
      tags: tags.split(' ')
    });
    onClose();
  };

  const handleSetCover = () => {
      if (onSetCover) {
          onSetCover(imageSrc);
          setCoverStatus(true);
          setTimeout(() => setCoverStatus(false), 2000);
      }
  };

  const handleAddToAnki = async () => {
    if (!settings.anki.deckName || !settings.anki.modelName) {
      alert(t.ankiError + " (No Deck/Model selected)");
      return;
    }
    
    setAnkiStatus('loading');
    try {
      await addNote({
        title: title || 'Untitled',
        note: note,
        screenshotBase64: imageSrc,
        tags: tags.split(' ').filter(s => s.trim().length > 0)
      }, settings.anki);
      setAnkiStatus('success');
      setTimeout(() => setAnkiStatus('idle'), 3000);
    } catch (e) {
      console.error(e);
      setAnkiStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
        
        {/* Left: Image Preview */}
        <div className="flex-1 bg-black flex items-center justify-center p-4 border-b md:border-b-0 md:border-r border-zinc-800 relative group">
           <img src={imageSrc} alt="Screenshot" className="max-w-full max-h-[50vh] md:max-h-full object-contain rounded border border-zinc-800 shadow-lg" />
           <div className="absolute top-4 left-4 flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`w-6 h-6 rounded-full border-2 ${selectedColor === c ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'} transition-all shadow-sm`}
                  style={{ backgroundColor: c }}
                />
              ))}
           </div>
           
           {/* Set Cover Button */}
           {onSetCover && (
               <button 
                 onClick={handleSetCover}
                 className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/60 hover:bg-zinc-800 border border-white/20 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-md flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
               >
                   {coverStatus ? <Check size={12} className="text-green-400" /> : <ImageIcon size={12} />}
                   {coverStatus ? t.coverSetSuccess : t.setCover}
               </button>
           )}
        </div>

        {/* Right: Controls */}
        <div className="w-full md:w-80 bg-zinc-900 flex flex-col">
           <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <h3 className="font-bold text-white flex items-center gap-2">
                 {t.screenshot}
              </h3>
              <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={20}/></button>
           </div>

           <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div className="space-y-2">
                 <label className="text-xs font-bold text-zinc-500 uppercase">{t.noteTitle}</label>
                 <input 
                   type="text" 
                   value={title}
                   onChange={(e) => setTitle(e.target.value)}
                   placeholder="Game Moment..."
                   className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-zinc-500 uppercase">{t.noteContent}</label>
                 <textarea 
                   value={note}
                   onChange={(e) => setNote(e.target.value)}
                   placeholder="Details about this moment..."
                   className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none resize-none"
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-zinc-500 uppercase">{t.fieldTags}</label>
                 <input 
                   type="text" 
                   value={tags}
                   onChange={(e) => setTags(e.target.value)}
                   placeholder="flashgen retro difficult"
                   className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                 />
              </div>
           </div>

           <div className="p-4 bg-zinc-950 border-t border-zinc-800 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                 <button onClick={handleExportImage} className="flex items-center justify-center gap-2 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400">
                    <Download size={14} /> {t.exportImage}
                 </button>
                 <button onClick={handleExportNote} className="flex items-center justify-center gap-2 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400">
                    <Download size={14} /> {t.exportNote}
                 </button>
              </div>
              
              <button 
                onClick={handleAddToAnki}
                disabled={ankiStatus === 'loading'}
                className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all text-sm
                  ${ankiStatus === 'success' ? 'bg-green-600 text-white' : 
                    ankiStatus === 'error' ? 'bg-red-600 text-white' : 
                    'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'}
                `}
              >
                 {ankiStatus === 'loading' && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
                 {ankiStatus === 'success' && <Check size={18} />}
                 {ankiStatus === 'error' && <AlertCircle size={18} />}
                 
                 {ankiStatus === 'idle' && t.addToAnki}
                 {ankiStatus === 'success' && t.ankiSuccess}
                 {ankiStatus === 'error' && t.ankiError}
              </button>

              <div className="grid grid-cols-2 gap-3 pt-1">
                 <button onClick={onClose} className="py-2 bg-transparent hover:bg-zinc-800 text-zinc-400 rounded-lg text-sm font-medium border border-zinc-700">{t.cancel}</button>
                 <button onClick={handleSaveToLibrary} className="py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium border border-zinc-600 flex items-center justify-center gap-2"><Save size={14}/> {t.save}</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};