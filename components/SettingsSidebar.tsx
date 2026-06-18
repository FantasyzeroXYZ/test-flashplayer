import React, { useState, useEffect } from 'react';
import { X, Globe, Keyboard, Save, Download, Upload, RotateCcw, ScanText, Server, Link2, CheckCircle, XCircle, Languages, ChevronDown, ChevronRight, Gamepad2, BookA, Database, Command } from 'lucide-react';
import { AppSettings, KeyMap, GamepadMap, DEFAULT_SETTINGS, APP_FUNCTIONS, RemapType, KeyRemapConfig, RemapEntry } from '../types';
import { getTranslation } from '../utils/i18n';
import { getDeckNames, getModelNames, getModelFieldNames } from '../services/ankiService';
import { VisualKeybinder } from './VisualKeybinder';
import { RemapModal } from './RemapModal';

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  onExportLibrary: () => void;
  onImportLibrary: (file: File) => void;
}

type Section = 'general' | 'controls' | 'saves' | 'anki' | 'remapper';

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onExportLibrary,
  onImportLibrary
}) => {
  // All sections collapsed by default
  const [openSections, setOpenSections] = useState<Set<Section>>(new Set());
  const [tempSettings, setTempSettings] = useState<AppSettings>(settings);
  const [activeControllerTab, setActiveControllerTab] = useState<'p1' | 'p2'>('p1');
  const [bindingMode, setBindingMode] = useState<'keyboard' | 'gamepad'>('keyboard');
  const t = getTranslation(tempSettings.language);

  // Anki State
  const [ankiDecks, setAnkiDecks] = useState<string[]>([]);
  const [ankiModels, setAnkiModels] = useState<string[]>([]);
  const [modelFields, setModelFields] = useState<string[]>([]);
  const [ankiConnectionStatus, setAnkiConnectionStatus] = useState<'none' | 'success' | 'fail'>('none');
  
  // Key Binding State
  const [bindingData, setBindingData] = useState<{ player: 'p1' | 'p2', key: keyof KeyMap } | null>(null);
  
  // Remapper State
  const [remapSourceKey, setRemapSourceKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTempSettings(settings);
    }
  }, [isOpen, settings]);

  // Keyboard Binding Listener
  useEffect(() => {
    const handleBindKeyPress = (e: KeyboardEvent) => {
      if (bindingData && bindingMode === 'keyboard') {
        e.preventDefault();
        e.stopPropagation();
        const key = e.key === ' ' ? 'Space' : e.key;
        
        if (bindingData.player === 'p1') {
            setTempSettings(prev => ({
                ...prev,
                keyMapP1: { ...prev.keyMapP1, [bindingData.key]: key }
            }));
        } else {
            setTempSettings(prev => ({
                ...prev,
                keyMapP2: { ...prev.keyMapP2, [bindingData.key]: key }
            }));
        }
        setBindingData(null);
      }
    };

    if (bindingData && bindingMode === 'keyboard') {
      window.addEventListener('keydown', handleBindKeyPress);
    }
    return () => window.removeEventListener('keydown', handleBindKeyPress);
  }, [bindingData, bindingMode]);

  // Gamepad Binding Listener
  useEffect(() => {
      let interval: number;
      if (bindingData && bindingMode === 'gamepad') {
          const pollGamepad = () => {
              const gps = navigator.getGamepads();
              if (!gps) return;
              
              // Check all connected gamepads
              for (const gp of gps) {
                  if (gp) {
                      gp.buttons.forEach((btn, idx) => {
                          if (btn.pressed) {
                              // Found a press - Bind the Button Index
                              if (bindingData.player === 'p1') {
                                  setTempSettings(prev => ({
                                      ...prev,
                                      gamepadMapP1: { ...prev.gamepadMapP1, [bindingData.key]: idx }
                                  }));
                              } else {
                                  setTempSettings(prev => ({
                                      ...prev,
                                      gamepadMapP2: { ...prev.gamepadMapP2, [bindingData.key]: idx }
                                  }));
                              }
                              setBindingData(null);
                          }
                      });
                  }
              }
          };
          // Poll frequently for responsiveness
          interval = setInterval(pollGamepad, 50);
      }
      return () => clearInterval(interval);
  }, [bindingData, bindingMode]);

  const handleSave = () => {
    onSave(tempSettings);
    onClose();
  };

  const handleReset = () => {
    setTempSettings(DEFAULT_SETTINGS);
  };

  const testAnkiConnection = async () => {
    try {
      const decks = await getDeckNames(tempSettings.anki);
      const models = await getModelNames(tempSettings.anki);
      setAnkiDecks(decks);
      setAnkiModels(models);
      setAnkiConnectionStatus('success');
      
      if (tempSettings.anki.modelName) {
        updateModelFields(tempSettings.anki.modelName);
      }
    } catch (e) {
      console.error(e);
      setAnkiConnectionStatus('fail');
    }
  };

  const updateModelFields = async (modelName: string) => {
    try {
      const fields = await getModelFieldNames(modelName, tempSettings.anki);
      setModelFields(fields);
    } catch (e) { console.error(e); }
  };

  const toggleSection = (section: Section) => {
      const newSections = new Set(openSections);
      if (newSections.has(section)) {
          newSections.delete(section);
      } else {
          newSections.add(section);
      }
      setOpenSections(newSections);
  };

  const handleRemap = (source: string, type: RemapType, target: string) => {
      setTempSettings(prev => ({
          ...prev,
          keyRemap: {
              ...prev.keyRemap,
              [source]: { type, target }
          }
      }));
  };

  const clearRemap = (source: string) => {
      setTempSettings(prev => {
          const newRemap = { ...prev.keyRemap };
          delete newRemap[source];
          return { ...prev, keyRemap: newRemap };
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Remap Modal */}
      {remapSourceKey && (
          <RemapModal 
             sourceKey={remapSourceKey}
             onClose={() => setRemapSourceKey(null)}
             onRemapKey={(target) => handleRemap(remapSourceKey, 'KEY', target)}
             onRemapFunction={(func) => handleRemap(remapSourceKey, 'FUNC', func)}
             onRemapMouse={(mouse) => handleRemap(remapSourceKey, 'MOUSE', mouse)}
             onClear={() => clearRemap(remapSourceKey)}
             lang={tempSettings.language}
          />
      )}

      {/* Binding Overlay */}
      {bindingData && (
        <div className="absolute inset-0 z-[110] bg-black/90 backdrop-blur flex items-center justify-center flex-col gap-6 text-white animate-fade-in" onClick={() => setBindingData(null)}>
           {bindingMode === 'keyboard' ? (
               <Keyboard size={48} className="animate-pulse text-blue-500" />
           ) : (
               <Gamepad2 size={48} className="animate-pulse text-green-500" />
           )}
           <p className="text-xl font-bold">{bindingMode === 'keyboard' ? t.pressKeyToBind : t.pressAnyKey}</p>
           <p className="text-zinc-500 text-sm">
               Target: <span className="text-yellow-400 font-bold">{bindingData.player === 'p1' ? 'P1' : 'P2'}</span> 
               {' '}- Action: <span className="text-blue-400 font-mono uppercase">{bindingData.key}</span>
           </p>
           
           {bindingMode === 'keyboard' && (
               <div className="w-full max-w-2xl px-4" onClick={(e) => e.stopPropagation()}>
                 <VisualKeybinder onKeySelect={(key) => {
                    if (bindingData.player === 'p1') {
                        setTempSettings(prev => ({ ...prev, keyMapP1: { ...prev.keyMapP1, [bindingData.key]: key } }));
                    } else {
                        setTempSettings(prev => ({ ...prev, keyMapP2: { ...prev.keyMapP2, [bindingData.key]: key } }));
                    }
                    setBindingData(null);
                 }} />
               </div>
           )}

           <p className="text-xs text-zinc-600 mt-2">(Click anywhere outside to cancel)</p>
        </div>
      )}

      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div className="relative w-full max-w-md h-full bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col animate-slide-in-right">
        
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800 shrink-0 bg-zinc-950">
          <h2 className="text-xl font-bold text-white">{t.settings}</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content - Vertical Accordion */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-900">
          
          {/* GENERAL SECTION */}
          <SectionHeader 
             title={t.general} 
             icon={<Globe size={18} />} 
             isOpen={openSections.has('general')} 
             onClick={() => toggleSection('general')} 
          />
          {openSections.has('general') && (
            <div className="p-6 space-y-6 bg-zinc-900 animate-fade-in border-b border-zinc-800">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">{t.language}</label>
                <div className="grid grid-cols-2 gap-3">
                  <LanguageOption label="简体中文" selected={tempSettings.language === 'zh'} onClick={() => setTempSettings(prev => ({ ...prev, language: 'zh' }))} />
                  <LanguageOption label="English" selected={tempSettings.language === 'en'} onClick={() => setTempSettings(prev => ({ ...prev, language: 'en' }))} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2"><BookA size={14}/> {t.dictionaryLang}</label>
                <select 
                  value={tempSettings.dictionarySourceLanguage}
                  onChange={(e) => setTempSettings(prev => ({ ...prev, dictionarySourceLanguage: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option value="en">English (en)</option>
                  <option value="es">Spanish (es)</option>
                  <option value="fr">French (fr)</option>
                  <option value="de">German (de)</option>
                  <option value="it">Italian (it)</option>
                  <option value="pt">Portuguese (pt)</option>
                  <option value="ru">Russian (ru)</option>
                  <option value="ja">Japanese (ja)</option>
                  <option value="zh">Chinese (zh)</option>
                </select>
                <p className="text-[10px] text-zinc-500">Source language for FreeDictionaryAPI.</p>
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-800">
                  <div className="flex items-center justify-between">
                     <label className="text-sm font-medium text-zinc-200 flex items-center gap-2"><ScanText size={16} />{t.enableOCR}</label>
                     <ToggleSwitch checked={tempSettings.enableOCR} onChange={() => setTempSettings(prev => ({ ...prev, enableOCR: !prev.enableOCR }))} />
                  </div>

                  {tempSettings.enableOCR && (
                    <div className="animate-fade-in space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">{t.ocrLanguage}</label>
                        <select 
                          value={tempSettings.ocrLanguage}
                          onChange={(e) => setTempSettings(prev => ({ ...prev, ocrLanguage: e.target.value }))}
                          className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                        >
                          <option value="eng">English</option>
                          <option value="chi_sim">简体中文</option>
                          <option value="chi_tra">繁体中文</option>
                          <option value="jpn">日本語</option>
                          <option value="kor">한국어</option>
                          <option value="rus">Русский</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2"><Languages size={14}/> {t.targetLanguage}</label>
                        <input 
                          type="text" 
                          value={tempSettings.targetLearningLanguage}
                          onChange={(e) => setTempSettings(prev => ({ ...prev, targetLearningLanguage: e.target.value }))}
                          className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                          placeholder="e.g. English, Chinese..."
                        />
                        <p className="text-[10px] text-zinc-500">Language used for AI explanations.</p>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* CONTROLS SECTION */}
          <SectionHeader 
             title={t.controls} 
             icon={<Keyboard size={18} />} 
             isOpen={openSections.has('controls')} 
             onClick={() => toggleSection('controls')} 
          />
          {openSections.has('controls') && (
            <div className="p-6 space-y-8 bg-zinc-900 animate-fade-in border-b border-zinc-800">
              
              {/* Virtual Gamepad Opacity */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">{t.virtualKeys}</h3>
                <div className="space-y-2">
                   <div className="flex justify-between text-sm text-zinc-400"><span>{t.opacity}</span><span>{Math.round(tempSettings.virtualGamepadOpacity * 100)}%</span></div>
                   <input type="range" min="0" max="1" step="0.1" value={tempSettings.virtualGamepadOpacity} onChange={(e) => setTempSettings(prev => ({ ...prev, virtualGamepadOpacity: parseFloat(e.target.value) }))} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                </div>
              </div>

              {/* P2 Toggle */}
              <div className="flex items-center justify-between">
                 <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    {t.enableP2}
                 </h3>
                 <ToggleSwitch checked={tempSettings.enablePlayer2} onChange={() => setTempSettings(prev => ({ ...prev, enablePlayer2: !prev.enablePlayer2 }))} />
              </div>

              {/* Player Tabs */}
              {tempSettings.enablePlayer2 ? (
                <div className="flex items-center gap-2 mb-4 border-b border-zinc-700">
                    <button 
                      onClick={() => setActiveControllerTab('p1')}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-bold border-b-2 transition-all ${activeControllerTab === 'p1' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-500 hover:text-white'}`}
                    >
                        <Gamepad2 size={16} /> {t.player1}
                    </button>
                    <button 
                      onClick={() => setActiveControllerTab('p2')}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-bold border-b-2 transition-all ${activeControllerTab === 'p2' ? 'border-yellow-500 text-yellow-400' : 'border-transparent text-zinc-500 hover:text-white'}`}
                    >
                        <Gamepad2 size={16} /> {t.player2}
                    </button>
                </div>
              ) : (
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                    <Gamepad2 size={16}/> {t.player1}
                </h3>
              )}

              {/* Binding Mode Toggle (Keyboard vs Gamepad) */}
              <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 mb-4">
                  <button onClick={() => setBindingMode('keyboard')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${bindingMode === 'keyboard' ? 'bg-blue-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>
                      <Keyboard size={14} /> KEYBOARD
                  </button>
                  <button onClick={() => setBindingMode('gamepad')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${bindingMode === 'gamepad' ? 'bg-green-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>
                      <Gamepad2 size={14} /> GAMEPAD
                  </button>
              </div>

              {/* Mapping Grid */}
              <div>
                 {(!tempSettings.enablePlayer2 || activeControllerTab === 'p1') && (
                    <div className="animate-fade-in">
                       <KeyMapGrid 
                         keyMap={tempSettings.keyMapP1} 
                         gamepadMap={tempSettings.gamepadMapP1}
                         mode={bindingMode}
                         onBind={(k) => setBindingData({ player: 'p1', key: k })} 
                         t={t} 
                       />
                    </div>
                 )}
                 {(tempSettings.enablePlayer2 && activeControllerTab === 'p2') && (
                    <div className="animate-fade-in">
                       <KeyMapGrid 
                         keyMap={tempSettings.keyMapP2} 
                         gamepadMap={tempSettings.gamepadMapP2}
                         mode={bindingMode}
                         onBind={(k) => setBindingData({ player: 'p2', key: k })} 
                         t={t} 
                       />
                    </div>
                 )}
              </div>

            </div>
          )}

          {/* KEYBOARD REMAPPER */}
          <SectionHeader 
             title={t.keyRemapper} 
             icon={<Command size={18} />} 
             isOpen={openSections.has('remapper')} 
             onClick={() => toggleSection('remapper')} 
          />
          {openSections.has('remapper') && (
             <div className="p-6 space-y-4 bg-zinc-900 animate-fade-in border-b border-zinc-800">
                <p className="text-xs text-zinc-500 mb-2">{t.remapInstruction}</p>
                <VisualKeybinder 
                   onKeySelect={(key) => {
                      const code = key.length === 1 ? `Key${key.toUpperCase()}` : key;
                      setRemapSourceKey(code); 
                   }} 
                   remappedKeys={Object.keys(tempSettings.keyRemap || {})}
                />
                
                {Object.keys(tempSettings.keyRemap || {}).length > 0 && (
                   <div className="mt-4 pt-4 border-t border-zinc-800">
                      <h4 className="text-xs font-bold text-zinc-400 mb-2">Active Remappings</h4>
                      <div className="space-y-2">
                         {Object.entries((tempSettings.keyRemap || {}) as KeyRemapConfig).map(([source, conf]) => (
                            <div key={source} className="flex justify-between items-center text-xs bg-zinc-800 p-2 rounded">
                               <span className="text-white font-mono">{source.replace('Key','')}</span>
                               <span className="text-zinc-500">→</span>
                               <span className={`font-bold ${conf.type === 'FUNC' ? 'text-yellow-400' : conf.type === 'MOUSE' ? 'text-purple-400' : 'text-blue-400'}`}>
                                  {conf.type === 'FUNC' ? (t as any)[`func_${(APP_FUNCTIONS as any)[conf.target] || conf.target}`] || conf.target : 
                                   conf.type === 'MOUSE' ? conf.target.replace('MOUSE_', 'Mouse ') :
                                   conf.target.replace('Key','')}
                               </span>
                               <button onClick={() => clearRemap(source)} className="text-zinc-500 hover:text-red-400 px-2"><X size={12} /></button>
                            </div>
                         ))}
                      </div>
                   </div>
                )}
             </div>
          )}

          {/* ANKI SECTION */}
          <SectionHeader 
             title={t.anki} 
             icon={<Server size={18} />} 
             isOpen={openSections.has('anki')} 
             onClick={() => toggleSection('anki')} 
          />
          {openSections.has('anki') && (
             <div className="p-6 space-y-6 bg-zinc-900 animate-fade-in border-b border-zinc-800">
                <div className="space-y-3 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                   <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2"><Link2 size={16}/> {t.ankiConfig}</h3>
                   <div className="grid grid-cols-3 gap-2">
                      <input 
                        type="text" 
                        value={tempSettings.anki.ip}
                        onChange={(e) => setTempSettings(prev => ({ ...prev, anki: { ...prev.anki, ip: e.target.value } }))}
                        className="col-span-2 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" 
                        placeholder="IP (e.g., 127.0.0.1)"
                      />
                      <input 
                        type="number" 
                        value={tempSettings.anki.port}
                        onChange={(e) => setTempSettings(prev => ({ ...prev, anki: { ...prev.anki, port: parseInt(e.target.value) } }))}
                        className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" 
                        placeholder="Port"
                      />
                   </div>
                   <button 
                     onClick={testAnkiConnection}
                     className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm font-medium border border-blue-500/30 flex items-center justify-center gap-2 transition-colors"
                   >
                     {ankiConnectionStatus === 'none' && t.ankiConnect}
                     {ankiConnectionStatus === 'success' && <><CheckCircle size={16}/> {t.ankiConnected}</>}
                     {ankiConnectionStatus === 'fail' && <><XCircle size={16}/> {t.ankiDisconnected}</>}
                   </button>
                </div>

                {ankiConnectionStatus === 'success' && (
                  <>
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-zinc-400">{t.ankiDeck}</label>
                       <select 
                         value={tempSettings.anki.deckName || ''}
                         onChange={(e) => setTempSettings(prev => ({ ...prev, anki: { ...prev.anki, deckName: e.target.value } }))}
                         className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2 outline-none"
                       >
                          <option value="">Select Deck...</option>
                          {ankiDecks.map(d => <option key={d} value={d}>{d}</option>)}
                       </select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-sm font-medium text-zinc-400">{t.ankiModel}</label>
                       <select 
                         value={tempSettings.anki.modelName || ''}
                         onChange={(e) => {
                           const mName = e.target.value;
                           setTempSettings(prev => ({ ...prev, anki: { ...prev.anki, modelName: mName } }));
                           updateModelFields(mName);
                         }}
                         className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2 outline-none"
                       >
                          <option value="">Select Note Type...</option>
                          {ankiModels.map(m => <option key={m} value={m}>{m}</option>)}
                       </select>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-zinc-800">
                       <h4 className="text-sm font-bold text-zinc-400">{t.ankiFields}</h4>
                       <FieldMapper label={t.fieldScreenshot} fields={modelFields} value={tempSettings.anki.fieldMapping.screenshot} onChange={(v) => setTempSettings(prev => ({...prev, anki: {...prev.anki, fieldMapping: {...prev.anki.fieldMapping, screenshot: v}}}))} />
                       <FieldMapper label={t.fieldTitle} fields={modelFields} value={tempSettings.anki.fieldMapping.title} onChange={(v) => setTempSettings(prev => ({...prev, anki: {...prev.anki, fieldMapping: {...prev.anki.fieldMapping, title: v}}}))} />
                       <FieldMapper label={t.fieldNote} fields={modelFields} value={tempSettings.anki.fieldMapping.note} onChange={(v) => setTempSettings(prev => ({...prev, anki: {...prev.anki, fieldMapping: {...prev.anki.fieldMapping, note: v}}}))} />
                    </div>
                  </>
                )}
             </div>
          )}

          {/* SAVES SECTION */}
          <SectionHeader 
             title={t.saves} 
             icon={<Database size={18} />} 
             isOpen={openSections.has('saves')} 
             onClick={() => toggleSection('saves')} 
          />
          {openSections.has('saves') && (
            <div className="p-6 space-y-6 bg-zinc-900 animate-fade-in border-b border-zinc-800">
              <div className="bg-zinc-800/50 p-4 rounded-xl text-sm text-zinc-400 border border-zinc-700">{t.saveManagerTip}</div>
              <div className="space-y-3">
                <button onClick={onExportLibrary} className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl flex items-center justify-between text-zinc-200 transition-all"><span className="flex items-center gap-3"><Download size={20} className="text-blue-500" /><span className="font-medium">{t.exportLib}</span></span></button>
                <div className="relative">
                  <input type="file" accept=".json" onChange={(e) => { if (e.target.files?.[0]) onImportLibrary(e.target.files[0]); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <button className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl flex items-center justify-between text-zinc-200 transition-all pointer-events-none"><span className="flex items-center gap-3"><Upload size={20} className="text-emerald-500" /><span className="font-medium">{t.importLib}</span></span></button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-950 shrink-0 flex justify-between items-center gap-4">
          <button onClick={handleReset} className="flex items-center gap-2 text-zinc-500 hover:text-white text-sm font-medium transition-colors"><RotateCcw size={16} />{t.reset}</button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-zinc-300 hover:bg-zinc-800 transition-colors font-medium text-sm">{t.cancel}</button>
            <button onClick={handleSave} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-900/30 font-bold text-sm transition-all active:scale-95">{t.saveSettings}</button>
          </div>
        </div>

      </div>
    </div>
  );
};

const SectionHeader = ({ title, icon, isOpen, onClick }: any) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center justify-between px-6 py-4 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors ${isOpen ? 'bg-zinc-800/30' : ''}`}
    >
        <div className="flex items-center gap-3 font-bold text-sm text-zinc-200">
            {icon}
            <span>{title}</span>
        </div>
        {isOpen ? <ChevronDown size={16} className="text-zinc-500" /> : <ChevronRight size={16} className="text-zinc-600" />}
    </button>
);

const LanguageOption = ({ label, selected, onClick }: any) => (
  <button onClick={onClick} className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${selected ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}>{label}</button>
);

const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <div 
        onClick={onChange}
        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${checked ? 'bg-blue-600' : 'bg-zinc-700'}`}
    >
    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
    </div>
);

const KeyMapGrid = ({ keyMap, gamepadMap, mode, onBind, t }: { keyMap: KeyMap, gamepadMap: GamepadMap, mode: 'keyboard'|'gamepad', onBind: (key: keyof KeyMap) => void, t: any }) => (
    <div className="grid grid-cols-2 gap-3">
        {['up', 'down', 'left', 'right', 'a', 'b', 'x', 'y', 'l1', 'r1', 'l2', 'r2', 'select', 'start', 'l3', 'r3'].map((key) => {
            const val = mode === 'keyboard' ? keyMap[key as keyof KeyMap] : `BTN ${gamepadMap[key as keyof GamepadMap]}`;
            const label = t[`key${key.charAt(0).toUpperCase() + key.slice(1)}`] || key;
            return <KeyBindButton key={key} label={label} value={String(val)} onClick={() => onBind(key as keyof KeyMap)} />;
        })}
    </div>
);

const KeyBindButton: React.FC<{ label: string, value: string, onClick: () => void }> = ({ label, value, onClick }) => (
  <div onClick={onClick} className="flex flex-col gap-1 p-2 bg-zinc-950/50 rounded-lg border border-zinc-800/50 cursor-pointer hover:border-blue-500/50 transition-colors group">
    <span className="text-zinc-500 text-xs font-bold uppercase">{label}</span>
    <div className="font-mono text-lg font-bold text-blue-400 text-center bg-zinc-900 rounded py-1 group-hover:bg-zinc-800">{value}</div>
  </div>
);

const FieldMapper = ({ label, fields, value, onChange }: any) => (
  <div className="flex items-center justify-between gap-2">
     <span className="text-xs text-zinc-400">{label}</span>
     <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded px-2 py-1 outline-none w-32">
        <option value="">(None)</option>
        {fields.map((f: string) => <option key={f} value={f}>{f}</option>)}
     </select>
  </div>
);
