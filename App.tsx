import React, { useState, useEffect, useRef } from 'react';
import { FlashPlayer, FlashPlayerRef } from './components/FlashPlayer';
import { Library } from './components/Library';
import { SettingsSidebar } from './components/SettingsSidebar';
import { DictionarySidebar } from './components/DictionarySidebar';
import { VirtualGamepad } from './components/VirtualGamepad';
import { GamepadManager } from './components/GamepadManager';
import { GameToolbar } from './components/GameToolbar';
import { ScreenCropper } from './components/ScreenCropper';
import { OCRResultModal } from './components/OCRResultModal';
import { SaveManagerModal } from './components/SaveManagerModal'; 
import { ScreenshotNoteModal } from './components/ScreenshotNoteModal';
import { EditGameModal } from './components/EditGameModal';
import { FolderPlus, Settings, Menu, X, ArrowLeft } from 'lucide-react';
import { FlashGame, AppSettings, DEFAULT_SETTINGS, FlashNote, APP_FUNCTIONS, MOUSE_FUNCTIONS } from './types';
import { saveGameToDb, getGamesFromDb, deleteGameFromDb, updateGameCover } from './services/storage';
import { getTranslation } from './utils/i18n';
import Tesseract from 'tesseract.js';

export default function App() {
  const [games, setGames] = useState<FlashGame[]>([]);
  const [notes, setNotes] = useState<FlashNote[]>(() => {
    const saved = localStorage.getItem('flashgen_notes');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeGame, setActiveGame] = useState<FlashGame | null>(null);
  const [isLoadingGame, setIsLoadingGame] = useState(false);
  const [isLibraryDrawerOpen, setIsLibraryDrawerOpen] = useState(false);
  const [showSettingsSidebar, setShowSettingsSidebar] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);
  const [showGamepad, setShowGamepad] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  
  // OCR State
  const [isOCRMode, setIsOCRMode] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [isOCRLoading, setIsOCRLoading] = useState(false);
  
  // Save Manager State
  const [isSaveManagerOpen, setIsSaveManagerOpen] = useState(false);
  const [saveManagerTargetUrl, setSaveManagerTargetUrl] = useState<string | null>(null);

  // Edit Modal State
  const [editingGame, setEditingGame] = useState<FlashGame | null>(null);

  // Screenshot Note State
  const [screenshotSrc, setScreenshotSrc] = useState<string | null>(null);

  // Pause State
  const [isAppPaused, setIsAppPaused] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('flashgen_settings');
    if (saved) {
        const parsed = JSON.parse(saved);
        return {
            ...DEFAULT_SETTINGS,
            ...parsed,
            keyMapP1: parsed.keyMap || parsed.keyMapP1 || DEFAULT_SETTINGS.keyMapP1,
            keyMapP2: parsed.keyMapP2 || DEFAULT_SETTINGS.keyMapP2,
            gamepadMapP1: parsed.gamepadMapP1 || DEFAULT_SETTINGS.gamepadMapP1,
            gamepadMapP2: parsed.gamepadMapP2 || DEFAULT_SETTINGS.gamepadMapP2,
            keyRemap: parsed.keyRemap || DEFAULT_SETTINGS.keyRemap,
            anki: { ...DEFAULT_SETTINGS.anki, ...(parsed.anki || {}) }
        };
    }
    return DEFAULT_SETTINGS;
  });

  const t = getTranslation(settings.language);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const playerRef = useRef<FlashPlayerRef>(null);

  // Global Key Interceptor for Remapping
  useEffect(() => {
    const handleKeyActivity = (e: KeyboardEvent) => {
        if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

        const mapped = settings.keyRemap?.[e.code];

        if (mapped) {
            e.preventDefault();
            e.stopPropagation();

            if (e.type === 'keydown' && e.repeat) return; 

            if (mapped.type === 'KEY') {
                const targetCode = mapped.target;
                let keyVal = targetCode.replace('Key', '').toLowerCase();
                if (targetCode.startsWith('Arrow')) keyVal = targetCode;
                if (targetCode === 'Space') keyVal = ' ';
                if (targetCode === 'Enter') keyVal = 'Enter';

                const newEvent = new KeyboardEvent(e.type, {
                    key: keyVal,
                    code: targetCode,
                    keyCode: 0, 
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                
                const rufflePlayer = document.querySelector('ruffle-player');
                if (rufflePlayer) {
                    rufflePlayer.dispatchEvent(newEvent);
                } else {
                    window.dispatchEvent(newEvent);
                }
            } else if (mapped.type === 'FUNC' && e.type === 'keydown') {
                executeFunction(mapped.target);
            } else if (mapped.type === 'MOUSE') {
                // Simulate Mouse Event on the player center
                const player = document.querySelector('ruffle-player');
                if (player) {
                    const rect = player.getBoundingClientRect();
                    const x = rect.left + rect.width / 2;
                    const y = rect.top + rect.height / 2;
                    const mouseEvent = new MouseEvent(e.type === 'keydown' ? 'mousedown' : 'mouseup', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        clientX: x,
                        clientY: y,
                        button: mapped.target === 'MOUSE_RIGHT' ? 2 : 0
                    });
                    player.dispatchEvent(mouseEvent);
                }
            }
        } else {
            // Native Shortcuts (F11, etc)
            if (e.key === 'F11' || (e.key === 'f' && e.ctrlKey)) {
                e.preventDefault();
                toggleFullscreen();
            }
        }
    };

    window.addEventListener('keydown', handleKeyActivity, { capture: true });
    window.addEventListener('keyup', handleKeyActivity, { capture: true });

    return () => {
        window.removeEventListener('keydown', handleKeyActivity, { capture: true });
        window.removeEventListener('keyup', handleKeyActivity, { capture: true });
    };
  }, [settings.keyRemap, activeGame]); 

  const executeFunction = (funcId: string) => {
      switch (funcId) {
          case 'pauseGame': toggleAppPause(); break;
          case 'mute': toggleMute(); break;
          case 'fullscreen': toggleFullscreen(); break;
          case 'screenshot': handleScreenshot(); break;
          case 'startOcr': handleStartOCR(); break;
          case 'dictionary': setShowDictionary(prev => !prev); break;
          case 'saveManager': openSaveManagerActive(); break;
          case 'resetGame': handleReset(); break;
      }
  };

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) setShowGamepad(true);
  }, []);

  const refreshLibrary = async () => {
      const loadedGames = await getGamesFromDb();
      setGames(loadedGames);
  };

  useEffect(() => {
    refreshLibrary();
  }, []);

  useEffect(() => {
    localStorage.setItem('flashgen_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('flashgen_notes', JSON.stringify(notes));
  }, [notes]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen();
    }
  };

  const toggleMute = () => {
     setIsMuted(prev => !prev);
  };

  const handleReset = () => {
    playerRef.current?.reload();
  };
  
  const toggleAppPause = () => {
      if (isAppPaused) {
          playerRef.current?.play();
      } else {
          playerRef.current?.pause();
      }
      setIsAppPaused(!isAppPaused);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newGames: FlashGame[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.toLowerCase().endsWith('.swf')) {
          const game: FlashGame = {
            id: crypto.randomUUID(),
            name: file.name.replace('.swf', ''),
            url: URL.createObjectURL(file),
            fileData: file,
            size: file.size,
            addedAt: Date.now()
          };
          newGames.push(game);
          await saveGameToDb(game);
        }
      }
      setGames(prev => [...prev, ...newGames]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteGame = async (id: string) => {
    if (window.confirm(t.deleteConfirm)) {
      await deleteGameFromDb(id);
      setGames(prev => prev.filter(g => g.id !== id));
      if (activeGame?.id === id) {
         setActiveGame(null);
         setIsLibraryDrawerOpen(false);
      }
    }
  };

  const handleSetCover = async (image: string) => {
      if (activeGame) {
          await updateGameCover(activeGame.id, image);
          // Update local state
          setGames(prev => prev.map(g => g.id === activeGame.id ? { ...g, coverImage: image } : g));
          setActiveGame(prev => prev ? { ...prev, coverImage: image } : null);
      }
  };

  const handleDeleteNote = (id: string) => {
    if (window.confirm(t.deleteConfirm)) {
      setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleSelectGame = (game: FlashGame) => {
      setIsLoadingGame(true);
      setActiveGame(game);
      setIsLibraryDrawerOpen(false);
  };

  const handleExitGame = () => {
    setActiveGame(null);
    setIsLibraryDrawerOpen(false);
    setSpeedMultiplier(1.0);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const captureCanvas = () => {
    const canvas = playerRef.current?.getCanvas();
    if (canvas) {
       return canvas.toDataURL('image/png');
    }
    return null;
  };

  const handleScreenshot = () => {
     const dataUrl = captureCanvas();
     if (dataUrl) {
        setScreenshotSrc(dataUrl);
     } else {
        alert("Could not capture screenshot. Ensure game is running.");
     }
  };

  const handleStartOCR = () => {
     if (!settings.enableOCR) {
       alert(t.ocrDisabledTip);
       return;
     }
     setIsOCRMode(true);
  };

  const handleCrop = async (rect: { x: number, y: number, width: number, height: number }) => {
    setIsOCRMode(false);
    setIsOCRLoading(true);
    setOcrResult('');

    try {
      const canvas = playerRef.current?.getCanvas();
      
      if (!canvas) {
        throw new Error('Canvas not found.');
      }

      const canvasRect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / canvasRect.width;
      const scaleY = canvas.height / canvasRect.height;
      const sx = (rect.x - canvasRect.left) * scaleX;
      const sy = (rect.y - canvasRect.top) * scaleY;
      const sWidth = rect.width * scaleX;
      const sHeight = rect.height * scaleY;

      const scaleFactor = 2.5; 
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = rect.width * scaleFactor;
      tempCanvas.height = rect.height * scaleFactor;
      const ctx = tempCanvas.getContext('2d');
      
      if (!ctx) throw new Error('Context creation failed');
      
      ctx.filter = 'contrast(1.4) brightness(1.1) grayscale(100%)';
      ctx.drawImage(canvas, sx, sy, sWidth, sHeight, 0, 0, tempCanvas.width, tempCanvas.height);
      
      const image = tempCanvas.toDataURL('image/png');
      const { data: { text } } = await Tesseract.recognize(image, settings.ocrLanguage);
      setOcrResult(text);
      
    } catch (error) {
      console.error('OCR Error:', error);
      setOcrResult('Error performing OCR.');
    } finally {
      setIsOCRLoading(false);
    }
  };

  const openSaveManagerForGame = (game: FlashGame) => {
     setSaveManagerTargetUrl(game.url); 
     setIsSaveManagerOpen(true);
  };
  
  const openSaveManagerActive = () => {
     setSaveManagerTargetUrl(activeGame?.url || null);
     setIsSaveManagerOpen(true);
  };

  const handleExportLibrary = async () => {
    try {
       const exportData = {
          version: 1,
          games: games.map(g => ({
             id: g.id,
             name: g.name,
             addedAt: g.addedAt,
             size: g.size
          }))
       };
       const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `flashgen_library_${new Date().toISOString().slice(0,10)}.json`;
       a.click();
       URL.revokeObjectURL(url);
    } catch (e) {
       console.error("Export failed", e);
       alert("Export failed");
    }
  };

  const handleImportLibrary = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
       try {
          const data = JSON.parse(e.target?.result as string);
          alert(`Found ${data.games?.length || 0} games in backup history. Note: SWF files must be re-imported manually.`);
       } catch(err) {
          alert("Invalid backup file");
       }
    };
    reader.readAsText(file);
  };

  const handleSaveNote = (noteData: Omit<FlashNote, 'id'>) => {
    setNotes(prev => [...prev, { ...noteData, id: crypto.randomUUID(), gameId: activeGame?.id }]);
  };

  return (
    <div className="h-screen w-screen bg-zinc-950 text-white flex overflow-hidden font-sans select-none">
      
      {/* Gamepad Manager needs both keymaps */}
      <GamepadManager 
        keyMapP1={settings.keyMapP1} 
        keyMapP2={settings.keyMapP2}
        gamepadMapP1={settings.gamepadMapP1}
        gamepadMapP2={settings.gamepadMapP2}
        enableP2={settings.enablePlayer2}
      />
      
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      </div>

      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileUpload} 
        accept=".swf" 
        multiple
        className="hidden" 
      />
      
      {isOCRMode && (
        <ScreenCropper onCrop={handleCrop} onCancel={() => setIsOCRMode(false)} />
      )}
      
      {(ocrResult !== null || isOCRLoading) && (
        <OCRResultModal 
          text={ocrResult || ''} 
          isLoading={isOCRLoading} 
          onClose={() => { setOcrResult(null); setIsOCRLoading(false); }}
          lang={settings.language}
          dictionarySourceLanguage={settings.dictionarySourceLanguage}
        />
      )}

      {editingGame && (
          <EditGameModal 
             game={editingGame}
             onClose={() => setEditingGame(null)}
             onUpdate={refreshLibrary}
             lang={settings.language}
          />
      )}

      <SaveManagerModal 
        visible={isSaveManagerOpen}
        onClose={() => setIsSaveManagerOpen(false)}
        currentSwfUrl={saveManagerTargetUrl}
        lang={settings.language}
        onReloadGame={handleReset}
      />

      {screenshotSrc && (
        <ScreenshotNoteModal 
          imageSrc={screenshotSrc}
          onClose={() => setScreenshotSrc(null)}
          settings={settings}
          onSaveToList={handleSaveNote}
          onSetCover={handleSetCover}
        />
      )}

      {/* ==================== HOME VIEW ==================== */}
      {!activeGame && (
        <div className="flex flex-col w-full h-full z-10 animate-fade-in">
          <div className="h-20 flex items-center justify-between px-6 md:px-12 shrink-0">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-center text-white font-bold text-xl">
                  F
                </div>
                <h1 className="text-xl font-bold tracking-tight text-zinc-100">{t.appName}</h1>
             </div>
             
             <div className="flex gap-3">
                <button 
                  onClick={() => setShowSettingsSidebar(true)}
                  className="p-2.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Settings size={20} />
                  <span className="hidden sm:inline text-sm font-medium">{t.settings}</span>
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-white text-black font-bold rounded-xl flex items-center gap-2 hover:bg-zinc-200 active:scale-95 transition-all shadow-lg hover:shadow-white/10"
                >
                  <FolderPlus size={18} />
                  <span className="hidden sm:inline">{t.importText}</span>
                  <span className="sm:hidden">{t.importText.split(' ')[0]}</span>
                </button>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
             <div className="max-w-7xl mx-auto px-6 md:px-12 py-6">
                <div className="mb-6">
                   <h2 className="text-3xl font-bold text-white mb-2">{t.library}</h2>
                </div>
                <Library 
                  games={games} 
                  notes={notes}
                  variant="grid"
                  onSelect={handleSelectGame} 
                  onDelete={handleDeleteGame}
                  onDeleteNote={handleDeleteNote}
                  onManageSaves={openSaveManagerForGame}
                  onEditGame={setEditingGame}
                  lang={settings.language}
                />
             </div>
          </div>
        </div>
      )}

      {/* ==================== GAME VIEW ==================== */}
      {activeGame && (
        <div className="relative w-full h-full flex flex-col z-20 bg-black">
          
          <div className="absolute top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 md:px-8 pointer-events-none">
             <div className="pointer-events-auto flex items-center gap-2">
                <button 
                  onClick={handleExitGame}
                  className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-all group"
                  title={t.back}
                >
                   <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <button 
                  onClick={() => setIsLibraryDrawerOpen(true)}
                  className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-all ml-2"
                  title={t.menu}
                >
                   <Menu size={20} />
                </button>
                <span className="ml-4 font-bold text-white/80 drop-shadow-md hidden md:block">{activeGame.name}</span>
             </div>
          </div>

          {isLibraryDrawerOpen && (
             <div 
               className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm"
               onClick={() => setIsLibraryDrawerOpen(false)}
             >
                <div 
                  className="absolute left-0 top-0 bottom-0 w-80 bg-zinc-900 border-r border-zinc-800 shadow-2xl flex flex-col animate-slide-in-left"
                  onClick={(e) => e.stopPropagation()}
                >
                   <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800">
                      <span className="font-bold text-lg">{t.library}</span>
                      <button onClick={() => setIsLibraryDrawerOpen(false)} className="text-zinc-500 hover:text-white">
                         <X size={20} />
                      </button>
                   </div>
                   <div className="flex-1 overflow-hidden">
                      <Library 
                        games={games} 
                        notes={notes}
                        variant="sidebar"
                        selectedId={activeGame.id}
                        onSelect={(g) => { handleSelectGame(g); }}
                        onDelete={handleDeleteGame}
                        onDeleteNote={handleDeleteNote}
                        onManageSaves={openSaveManagerForGame}
                        onEditGame={setEditingGame}
                        lang={settings.language}
                      />
                   </div>
                   <div className="p-4 border-t border-zinc-800 bg-zinc-900">
                      <button 
                        onClick={() => { setIsLibraryDrawerOpen(false); setShowSettingsSidebar(true); }}
                        className="w-full py-3 bg-zinc-800 text-zinc-300 font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-700 hover:text-white transition-all"
                      >
                        <Settings size={18} />
                        {t.settings}
                      </button>
                   </div>
                </div>
             </div>
          )}

          <div className="flex-1 w-full h-full flex items-center justify-center relative">
              <div className="w-full h-full max-w-full max-h-full flex items-center justify-center">
                   <FlashPlayer 
                      ref={playerRef} 
                      swfUrl={activeGame.url} 
                      onLoad={() => setIsLoadingGame(false)}
                      isLoading={isLoadingGame}
                      speedMultiplier={speedMultiplier}
                      lang={settings.language}
                   />
                   <VirtualGamepad 
                     visible={showGamepad} 
                     keyMap={settings.keyMapP1} 
                     opacity={settings.virtualGamepadOpacity}
                   />
              </div>
          </div>

          <div className="absolute bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none">
             <div className="pointer-events-auto">
                <GameToolbar 
                  onReset={handleReset}
                  onToggleFullscreen={toggleFullscreen}
                  isMuted={isMuted}
                  onToggleMute={toggleMute}
                  showGamepad={showGamepad}
                  onToggleGamepad={() => setShowGamepad(!showGamepad)}
                  onStartOCR={handleStartOCR}
                  onSaveGame={openSaveManagerActive}
                  onScreenshot={handleScreenshot}
                  onTogglePause={toggleAppPause}
                  onOpenDictionary={() => setShowDictionary(true)}
                  lang={settings.language}
                  speed={speedMultiplier}
                  onSpeedChange={setSpeedMultiplier}
                />
             </div>
          </div>

        </div>
      )}

      <SettingsSidebar 
        isOpen={showSettingsSidebar}
        onClose={() => setShowSettingsSidebar(false)}
        settings={settings}
        onSave={setSettings}
        onExportLibrary={handleExportLibrary}
        onImportLibrary={handleImportLibrary}
      />

      <DictionarySidebar 
        isOpen={showDictionary}
        onClose={() => setShowDictionary(false)}
        lang={settings.language}
        dictionarySourceLanguage={settings.dictionarySourceLanguage}
      />
    </div>
  );
}