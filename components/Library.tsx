import React, { useState } from 'react';
import { FlashGame, FlashNote, Language } from '../types';
import { Trash2, File as FileIcon, Search, Gamepad2, Calendar, LayoutGrid, List, HardDrive, Save, StickyNote, Image as ImageIcon, Pencil } from 'lucide-react';
import { getTranslation } from '../utils/i18n';

interface LibraryProps {
  games: FlashGame[];
  notes?: FlashNote[];
  onSelect: (game: FlashGame) => void;
  onDelete: (id: string) => void;
  onManageSaves: (game: FlashGame) => void;
  onEditGame: (game: FlashGame) => void;
  onDeleteNote?: (id: string) => void;
  selectedId?: string;
  variant?: 'sidebar' | 'grid';
  lang: Language;
}

export const Library: React.FC<LibraryProps> = ({ 
  games, 
  notes = [],
  onSelect, 
  onDelete, 
  onManageSaves,
  onEditGame,
  onDeleteNote,
  selectedId,
  variant = 'sidebar',
  lang
}) => {
  const [search, setSearch] = React.useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'games' | 'notes'>('games');
  const t = getTranslation(lang);

  const filteredGames = games.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
  const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(search.toLowerCase()));

  // ================= GRID VIEW (HOME) =================
  if (variant === 'grid') {
    if (games.length === 0) {
      return (
        <div className={`flex flex-col items-center justify-center text-zinc-500 h-64 text-center px-4`}>
          <div className="mb-4 p-4 bg-zinc-900 rounded-full border border-zinc-800">
            <Gamepad2 size={48} className="opacity-50" />
          </div>
          <p className="font-medium text-zinc-400">{t.noGames}</p>
          <p className="text-xs mt-1 opacity-70">{t.importTip}</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-3 text-zinc-500" size={18} />
            <input 
              type="text" 
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 focus:bg-zinc-800 focus:border-blue-500/50 focus:outline-none transition-all placeholder:text-zinc-600 shadow-sm"
            />
          </div>

          <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800 shrink-0">
             <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`} title={t.viewGrid}><LayoutGrid size={18} /></button>
             <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`} title={t.viewList}><List size={18} /></button>
          </div>
        </div>

        {/* Games Grid */}
        <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6" : "flex flex-col gap-2"}>
          {filteredGames.map(game => (
            <div 
              key={game.id}
              onClick={() => onSelect(game)}
              className={viewMode === 'grid' 
                ? "group relative bg-zinc-900 rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-105 hover:shadow-2xl hover:shadow-black/50 aspect-[3/4] border border-zinc-800 hover:border-zinc-600"
                : "group flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 hover:border-blue-500/30 rounded-xl cursor-pointer transition-all"
              }
            >
              {viewMode === 'grid' ? (
                <>
                  {/* Improved Cover Display */}
                  <div className="absolute inset-0">
                      {game.coverImage ? (
                          <img src={game.coverImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                              <FileIcon size={48} className="text-zinc-700 group-hover:text-zinc-600 transition-colors" />
                          </div>
                      )}
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  {/* Content Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col justify-end h-full">
                      <div className="translate-y-2 group-hover:translate-y-0 transition-transform">
                        <h3 className="font-bold text-white text-lg leading-tight line-clamp-2 drop-shadow-md">{game.name}</h3>
                        <div className="flex items-center justify-between mt-2 text-[10px] text-zinc-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity delay-75">
                            <span>{(game.size ? (game.size / 1024 / 1024).toFixed(1) : '0')} MB</span>
                            <span>{new Date(game.addedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                  </div>

                  {/* Hover Actions (Top Right) */}
                  <div className="absolute top-2 right-2 flex flex-col gap-2 translate-x-10 group-hover:translate-x-0 transition-transform duration-300">
                      <button onClick={(e) => { e.stopPropagation(); onEditGame(game); }} className="p-2 bg-black/60 hover:bg-white hover:text-black text-white rounded-full backdrop-blur-sm transition-colors shadow-lg" title="Edit">
                          <Pencil size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onManageSaves(game); }} className="p-2 bg-black/60 hover:bg-blue-500 text-white rounded-full backdrop-blur-sm transition-colors shadow-lg" title="Saves">
                          <Save size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onDelete(game.id); }} className="p-2 bg-black/60 hover:bg-red-500 text-white rounded-full backdrop-blur-sm transition-colors shadow-lg" title="Delete">
                          <Trash2 size={14} />
                      </button>
                  </div>
                </>
              ) : (
                <>
                   <div className="flex items-center gap-4 flex-1 min-w-0">
                      {game.coverImage ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-zinc-700 bg-black">
                              <img src={game.coverImage} className="w-full h-full object-cover" />
                          </div>
                      ) : (
                          <div className="p-3 bg-zinc-950 rounded-lg text-blue-500 group-hover:text-blue-400 shrink-0"><FileIcon size={20} /></div>
                      )}
                      <div className="flex flex-col min-w-0">
                         <h3 className="font-bold text-zinc-200 truncate text-base">{game.name}</h3>
                         <span className="text-xs text-zinc-500 font-mono flex items-center gap-2">{game.size ? (game.size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'} <span className="w-1 h-1 bg-zinc-700 rounded-full" /> {new Date(game.addedAt).toLocaleDateString()}</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity px-2">
                      <button onClick={(e) => { e.stopPropagation(); onEditGame(game); }} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"><Pencil size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); onManageSaves(game); }} className="p-2 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"><Save size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); onDelete(game.id); }} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
                   </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ================= SIDEBAR VIEW =================
  return (
    <div className="flex flex-col h-full font-sans">
      <div className="p-4 border-b border-zinc-800/50 flex flex-col gap-3 shrink-0">
        
        {/* Tabs */}
        <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800 mb-1">
           <button 
             onClick={() => setActiveTab('games')}
             className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'games' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
           >
             <Gamepad2 size={14} /> {t.library}
           </button>
           <button 
             onClick={() => setActiveTab('notes')}
             className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'notes' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
           >
             <StickyNote size={14} /> {t.notesLibrary}
           </button>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-2.5 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" size={14} />
          <input 
            type="text" 
            placeholder={t.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/20 border border-zinc-800 rounded-lg py-1.5 pl-9 pr-3 text-xs text-zinc-200 focus:bg-black/40 focus:border-zinc-600 focus:outline-none transition-all placeholder:text-zinc-600"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {activeTab === 'games' ? (
          filteredGames.length > 0 ? filteredGames.map(game => (
              <div 
                key={game.id}
                onClick={() => onSelect(game)}
                className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border
                  ${selectedId === game.id 
                    ? 'bg-blue-600/10 border-blue-500/30 text-blue-100' 
                    : 'border-transparent hover:bg-white/5 text-zinc-400 hover:text-zinc-200'
                  }
                `}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {game.coverImage ? (
                      <div className="w-8 h-8 rounded overflow-hidden shrink-0 border border-zinc-700/50 bg-black">
                          <img src={game.coverImage} className="w-full h-full object-cover" />
                      </div>
                  ) : (
                      <div className={`p-1.5 rounded transition-colors ${selectedId === game.id ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700'}`}>
                        <FileIcon size={14} />
                      </div>
                  )}
                  <span className={`text-sm font-medium truncate ${selectedId === game.id ? 'text-white' : ''}`}>
                    {game.name}
                  </span>
                </div>
                
                {selectedId !== game.id && (
                  <button onClick={(e) => { e.stopPropagation(); onEditGame(game); }} className="p-1.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                    <Pencil size={12} />
                  </button>
                )}
              </div>
            )) : <div className="text-center text-zinc-600 text-xs py-4">{t.noGames}</div>
        ) : (
          filteredNotes.length > 0 ? filteredNotes.map(note => (
            <div key={note.id} className="group p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 transition-all flex gap-3">
               <div className="w-12 h-12 bg-black rounded shrink-0 overflow-hidden border border-zinc-700">
                  <img src={note.imageData} className="w-full h-full object-cover" />
               </div>
               <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-zinc-200 truncate">{note.title || 'Untitled'}</h4>
                  <p className="text-xs text-zinc-500 truncate">{note.content || 'No details'}</p>
                  <div className="flex gap-2 mt-1">
                     <span className="text-[10px] text-zinc-600">{new Date(note.timestamp).toLocaleDateString()}</span>
                  </div>
               </div>
               <div className="flex flex-col justify-between items-end">
                   <div className="w-2 h-2 rounded-full" style={{backgroundColor: note.color}}></div>
                   {onDeleteNote && <button onClick={() => onDeleteNote(note.id)} className="text-zinc-600 hover:text-red-400"><Trash2 size={14}/></button>}
               </div>
            </div>
          )) : <div className="text-center text-zinc-600 text-xs py-4">{t.noNotes}</div>
        )}
      </div>
    </div>
  );
};