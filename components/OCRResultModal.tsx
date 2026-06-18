import React, { useState } from 'react';
import { X, Copy, Loader2, ScanText, BookOpen } from 'lucide-react';
import { getTranslation } from '../utils/i18n';
import { Language } from '../types';
import { fetchDefinition, DictionaryDefinition } from '../services/dictionaryService';

interface OCRResultModalProps {
  text: string;
  isLoading: boolean;
  onClose: () => void;
  lang: Language;
  dictionarySourceLanguage: string;
}

export const OCRResultModal: React.FC<OCRResultModalProps> = ({ text, isLoading, onClose, lang, dictionarySourceLanguage }) => {
  const t = getTranslation(lang);
  const [definition, setDefinition] = useState<DictionaryDefinition[] | null>(null);
  const [isDefining, setIsDefining] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
  };

  const handleWordClick = async (word: string) => {
    // Basic cleanup
    const cleanWord = word.replace(/[^\w\u4e00-\u9fa5\u0400-\u04FF\u3040-\u309F\u30A0-\u30FF]/g, '');
    if (!cleanWord) return;

    setSelectedWord(cleanWord);
    setIsDefining(true);
    setDefinition(null);

    const defs = await fetchDefinition(cleanWord, dictionarySourceLanguage);
    setDefinition(defs);
    setIsDefining(false);
  };

  const words = text.split(/(\s+)/); 

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex flex-col animate-fade-in overflow-hidden max-h-[80vh]">
        
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-2 text-white font-bold">
            <ScanText size={18} className="text-blue-500" />
            {t.ocrResult}
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-0 flex flex-col">
            <div className="p-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8 text-zinc-400 gap-3">
                  <Loader2 size={32} className="animate-spin text-blue-500" />
                  <p>{t.ocrProcessing}</p>
                </div>
              ) : (
                <div className="text-zinc-200 font-sans text-sm leading-relaxed">
                  {text ? (
                      <div className="flex flex-wrap">
                          {words.map((chunk, i) => {
                             if (chunk.trim() === '') return <span key={i} className="whitespace-pre">{chunk}</span>;
                             return (
                               <span 
                                 key={i}
                                 onClick={() => handleWordClick(chunk)}
                                 className="cursor-pointer hover:bg-blue-500/30 hover:text-blue-200 rounded px-0.5 transition-colors"
                               >
                                 {chunk}
                               </span>
                             )
                          })}
                      </div>
                  ) : (
                      <span className="text-zinc-500 italic">No text detected</span>
                  )}
                  <p className="text-[10px] text-zinc-500 mt-4 border-t border-zinc-800 pt-2">{t.lookupWord} ({dictionarySourceLanguage})</p>
                </div>
              )}
            </div>

            {/* Definition Section */}
            {(selectedWord || isDefining) && (
               <div className="border-t border-zinc-800 bg-zinc-950/80 p-4 animate-slide-in-up">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-400 mb-2 uppercase">
                      <BookOpen size={14} /> {t.definition}: {selectedWord}
                  </div>
                  {isDefining ? (
                      <div className="text-zinc-500 text-sm flex items-center gap-2">
                          <Loader2 size={14} className="animate-spin" /> Loading...
                      </div>
                  ) : definition ? (
                      <div className="text-zinc-300 text-sm leading-relaxed space-y-3">
                         {definition.map((d, i) => (
                             <div key={i} className="space-y-1">
                                <div className="flex items-center gap-2 text-xs text-zinc-400">
                                   {d.phonetic && <span className="font-mono">[{d.phonetic}]</span>}
                                   <span className="italic">{d.meanings[0]?.partOfSpeech}</span>
                                </div>
                                <ul className="list-disc list-inside space-y-1">
                                    {d.meanings[0]?.definitions.slice(0, 3).map((def, j) => (
                                        <li key={j}>{def.definition}</li>
                                    ))}
                                </ul>
                             </div>
                         ))}
                      </div>
                  ) : (
                    <p className="text-zinc-500 italic text-sm">No definition found.</p>
                  )}
               </div>
            )}
        </div>

        {!isLoading && text && (
           <div className="px-4 py-3 bg-zinc-950/30 border-t border-zinc-800 flex justify-end shrink-0">
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Copy size={16} />
                {t.copy}
              </button>
           </div>
        )}
      </div>
    </div>
  );
};