import { FlashGame } from "../types";

const DB_NAME = 'FlashGenDB';
const STORE_NAME = 'games';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (event: any) => resolve(event.target.result);
    request.onerror = (event) => reject(event);
  });
};

export const saveGameToDb = async (game: FlashGame) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    // We need to store the blob, but the URL is temporary.
    // When saving, we assume fileData is present.
    const { url, ...gameData } = game; 
    store.put(gameData);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

export const updateGameData = async (id: string, updates: Partial<FlashGame>) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    
    getReq.onsuccess = () => {
        const data = getReq.result;
        if (data) {
            const newData = { ...data, ...updates };
            // Ensure we don't save the ephemeral URL
            const { url, ...saveData } = newData;
            store.put(saveData);
            resolve(true);
        } else {
            resolve(false);
        }
    };
    getReq.onerror = () => reject(getReq.error);
  });
};

export const updateGameCover = async (id: string, coverImage: string) => {
  return updateGameData(id, { coverImage });
};

export const getGamesFromDb = async (): Promise<FlashGame[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const games = request.result.map((g: any) => ({
        ...g,
        url: URL.createObjectURL(g.fileData) // Recreate blob URL on load
      }));
      resolve(games);
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteGameFromDb = async (id: string) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(id);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
    });
};