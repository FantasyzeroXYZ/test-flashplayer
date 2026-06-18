export interface RuffleSaveItem {
  key: string;
  name: string; // Extracted LSO name (e.g., "SaveData")
  size: number;
  data: ArrayBuffer;
  isCurrentSession: boolean;
}

const DB_NAME = 'ruffle-shared-objects';
const STORE_NAME = 'shared-objects';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);
    request.onsuccess = (event: any) => resolve(event.target.result);
    request.onerror = (event) => reject(event);
    // We don't handle upgradeneeded because Ruffle creates it. 
    // If it doesn't exist, we can't do anything yet anyway.
  });
};

export const listRuffleSaves = async (currentSwfUrl: string | null): Promise<RuffleSaveItem[]> => {
  try {
    const db = await initDB();
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      return [];
    }
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAllKeys();
      const valueRequest = store.getAll();

      request.onsuccess = () => {
        const keys = request.result as string[];
        const values = valueRequest.result as ArrayBuffer[]; // Ruffle stores values as ArrayBuffer (AMF)
        
        const items: RuffleSaveItem[] = keys.map((key, index) => {
           // Key format is complex, usually: "http://domain/path/swf/Name"
           // With Blob URLs: "http://localhost.../blob:http://localhost.../uuid/Name"
           
           // Extract LSO Name (last part)
           const parts = key.split('/');
           const name = parts[parts.length - 1];
           
           // Check if belongs to current session
           // Ruffle's key for a blob URL usually contains the blob URL string
           const isCurrent = currentSwfUrl ? key.includes(currentSwfUrl) : false;

           return {
             key,
             name,
             size: values[index]?.byteLength || 0,
             data: values[index],
             isCurrentSession: isCurrent
           };
        });
        
        // Sort: Current session first, then others
        resolve(items.sort((a, b) => (a.isCurrentSession === b.isCurrentSession) ? 0 : a.isCurrentSession ? -1 : 1));
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn("Ruffle DB not ready or accessible", e);
    return [];
  }
};

export const deleteRuffleSave = async (key: string) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

export const writeRuffleSave = async (key: string, data: ArrayBuffer) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(data, key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};