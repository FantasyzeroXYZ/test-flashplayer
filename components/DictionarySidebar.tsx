import React, { useState } from 'react';
import { X, Search, BookA, Loader2 } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../utils/i18n';
import { fetchDefinition, DictionaryDefinition } from '../services/dictionaryService';

interface DictionarySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  dictionarySourceLanguage: string;
}

export const DictionarySidebar: React.FC<DictionarySidebarProps> = ({ isOpen, onClose, lang, dictionarySourceLanguage }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<DictionaryDefinition[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const t = getTranslation(lang);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setResult(null);
    try {
      const defs = await fetchDefinition(query.trim(), dictionarySourceLanguage);
      setResult(defs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end pointer-events-none">
      <div 
        className="pointer-events-auto w-full max-w-sm h-full bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800 shrink-0 bg-zinc-950">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
             <BookA size={20} className="text-blue-500"/>
             {t.dictionary}
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
           <div className="relative flex items-center">
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.dictionarySearch}
                className="w-full bg-black/30 border border-zinc-700 rounded-xl py-3 pl-4 pr-12 text-zinc-200 focus:border-blue-500 outline-none"
              />
              <button 
                onClick={handleSearch}
                className="absolute right-2 p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-colors"
              >
                 {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              </button>
           </div>
           <div className="mt-2 text-xs text-zinc-500 text-right">
              Source: <span className="font-mono text-zinc-400">{dictionarySourceLanguage}</span>
           </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
           {loading && (
              <div className="flex flex-col items-center justify-center py-10 text-zinc-500 gap-2">
                 <Loader2 size={32} className="animate-spin text-blue-500" />
                 <span>Searching...</span>
              </div>
           )}

           {!loading && searched && !result && (
              <div className="text-center text-zinc-500 py-10 italic">
                 {t.dictionaryNoResult}
              </div>
           )}

           {!loading && result && (
              <div className="space-y-6 animate-fade-in">
                 {result.map((item, idx) => (
                    <div key={idx} className="space-y-3">
                       <div className="flex items-baseline gap-3 border-b border-zinc-800 pb-2">
                          <h2 className="text-2xl font-bold text-white">{item.word}</h2>
                          {item.phonetic && <span className="text-zinc-400 font-mono text-sm">[{item.phonetic}]</span>}
                       </div>
                       
                       <div className="space-y-4">
                          {item.meanings.map((meaning, mIdx) => (
                             <div key={mIdx} className="space-y-2">
                                <span className="inline-block px-2 py-0.5 rounded bg-zinc-800 text-blue-400 text-xs font-bold uppercase tracking-wider">
                                   {meaning.partOfSpeech}
                                </span>
                                <ul className="list-disc list-inside space-y-2 pl-1">
                                   {meaning.definitions.map((def, dIdx) => (
                                      <li key={dIdx} className="text-sm text-zinc-300 leading-relaxed">
                                         {def.definition}
                                         {def.example && (
                                            <div className="text-zinc-500 text-xs mt-1 italic ml-4">
                                               "{def.example}"
                                            </div>
                                         )}
                                      </li>
                                   ))}
                                </ul>
                             </div>
                          ))}
                       </div>
                    </div>
                 ))}
              </div>
           )}
        </div>
      </div>
    </div>
  );
};