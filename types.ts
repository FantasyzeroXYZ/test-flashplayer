export interface FlashGame {
  id: string;
  name: string;
  url: string; // Blob URL
  fileData?: Blob; // For storage
  size?: number;
  addedAt: number;
  coverImage?: string; // Base64 image
}

export interface FlashSceneData {
  title: string;
  backgroundColor: string;
  viewBox: string;
  svgContent: string;
}

export interface FlashNote {
  id: string;
  gameId?: string;
  title: string;
  content: string;
  timestamp: number;
  imageData: string; // Base64
  color: string;
  tags: string[];
}

export type Language = 'zh' | 'en';

// Expanded KeyMap for full controller support
export interface KeyMap {
  up: string;
  down: string;
  left: string;
  right: string;
  a: string;
  b: string;
  x: string;
  y: string;
  l1: string;
  r1: string;
  l2: string;
  r2: string;
  select: string;
  start: string;
  l3: string;
  r3: string;
}

// Map Action to Gamepad Button Index
export interface GamepadMap {
  up: number;
  down: number;
  left: number;
  right: number;
  a: number;
  b: number;
  x: number;
  y: number;
  l1: number;
  r1: number;
  l2: number;
  r2: number;
  select: number;
  start: number;
  l3: number;
  r3: number;
}

export interface ShortcutConfig {
  toggleFullscreen: string;
  toggleMute: string;
  pause: string;
  bossKey: string;
}

// Remapping Types
export type RemapType = 'KEY' | 'FUNC' | 'MOUSE';

export interface RemapEntry {
  type: RemapType;
  target: string; // KeyCode, Function ID, or Mouse Action
}

// Map Physical Key Code -> Remap Action
export type KeyRemapConfig = Record<string, RemapEntry>;

export const APP_FUNCTIONS = {
  FUNC_PAUSE: 'pauseGame',
  FUNC_MUTE: 'mute',
  FUNC_FULLSCREEN: 'fullscreen',
  FUNC_SCREENSHOT: 'screenshot',
  FUNC_OCR: 'startOcr',
  FUNC_DICTIONARY: 'dictionary',
  FUNC_SAVE_MANAGER: 'saveGame',
  FUNC_RESET: 'resetGame'
};

export const MOUSE_FUNCTIONS = {
  MOUSE_LEFT: 'Left Click',
  MOUSE_RIGHT: 'Right Click'
};

// Anki Configuration Types
export interface AnkiFieldMapping {
  screenshot: string; // Field name for the image
  title: string;      // Field name for the title/word
  note: string;       // Field name for the note/meaning
  tags: string;       // Field name for tags (optional, usually tags are separate)
  audio?: string;
}

export interface AnkiConfig {
  ip: string;
  port: number;
  deckName: string | null;
  modelName: string | null;
  fieldMapping: AnkiFieldMapping;
}

export interface AppSettings {
  language: Language;
  
  // Controls
  enablePlayer2: boolean;
  keyMapP1: KeyMap;
  keyMapP2: KeyMap;
  
  // Gamepad Mappings (Indices)
  gamepadMapP1: GamepadMap;
  gamepadMapP2: GamepadMap;

  keyRemap: KeyRemapConfig; // New field for physical remapping
  
  virtualGamepadOpacity: number;
  shortcuts?: ShortcutConfig;
  
  // OCR & Dictionary
  enableOCR: boolean;
  ocrLanguage: string;
  dictionarySourceLanguage: string; // For the FreeDictionaryAPI
  targetLearningLanguage: string;   // For Gemini explanations (fallback or detailed)
  
  anki: AnkiConfig;
}

export const DEFAULT_KEYMAP_P1: KeyMap = {
  up: 'w',
  down: 's',
  left: 'a',
  right: 'd',
  a: 'j',
  b: 'k',
  x: 'u',
  y: 'i',
  l1: 'q',
  r1: 'e',
  l2: '1',
  r2: '2',
  select: 'Shift',
  start: 'Enter',
  l3: 'z',
  r3: 'x'
};

export const DEFAULT_KEYMAP_P2: KeyMap = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  a: '1', // Numpad 1
  b: '2', // Numpad 2
  x: '4', // Numpad 4
  y: '5', // Numpad 5
  l1: '7',
  r1: '8',
  l2: '9',
  r2: '0',
  select: 'Control',
  start: 'Alt',
  l3: '.',
  r3: '+'
};

// Standard Gamepad Layout (Xbox/PS style via Web Gamepad API)
export const DEFAULT_GAMEPAD_MAP: GamepadMap = {
  a: 0, b: 1, x: 2, y: 3,
  l1: 4, r1: 5, l2: 6, r2: 7,
  select: 8, start: 9, l3: 10, r3: 11,
  up: 12, down: 13, left: 14, right: 15
};

export const DEFAULT_SHORTCUTS: ShortcutConfig = {
  toggleFullscreen: 'F11',
  toggleMute: 'm',
  pause: 'p',
  bossKey: 'b'
};

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'zh',
  enablePlayer2: false,
  keyMapP1: DEFAULT_KEYMAP_P1,
  keyMapP2: DEFAULT_KEYMAP_P2,
  gamepadMapP1: DEFAULT_GAMEPAD_MAP,
  gamepadMapP2: DEFAULT_GAMEPAD_MAP,
  keyRemap: {},
  virtualGamepadOpacity: 0.6,
  shortcuts: DEFAULT_SHORTCUTS,
  enableOCR: false,
  ocrLanguage: 'chi_sim',
  dictionarySourceLanguage: 'en',
  targetLearningLanguage: 'Chinese',
  anki: {
    ip: '127.0.0.1',
    port: 8765,
    deckName: null,
    modelName: null,
    fieldMapping: {
      screenshot: '',
      title: '',
      note: '',
      tags: ''
    }
  }
};