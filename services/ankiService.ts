import { AnkiConfig } from "../types";

const invoke = async (action: string, version: number, params: any = {}, config: { ip: string, port: number }) => {
  const response = await fetch(`http://${config.ip}:${config.port}`, {
    method: 'POST',
    mode: 'cors', // AnkiConnect needs to be configured to allow CORS or use no-cors (but then we can't read response)
                  // Standard AnkiConnect allows localhost.
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action, version, params })
  });
  
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  
  const result = await response.json();
  if (Object.getOwnPropertyNames(result).length != 2) {
    throw new Error('response has an unexpected number of fields');
  }
  if (!result.hasOwnProperty('error')) {
    throw new Error('response is missing required error field');
  }
  if (!result.hasOwnProperty('result')) {
    throw new Error('response is missing required result field');
  }
  if (result.error) {
    throw new Error(result.error);
  }
  return result.result;
};

export const getDeckNames = async (config: AnkiConfig) => {
  return invoke('deckNames', 6, {}, config);
};

export const getModelNames = async (config: AnkiConfig) => {
  return invoke('modelNames', 6, {}, config);
};

export const getModelFieldNames = async (modelName: string, config: AnkiConfig) => {
  return invoke('modelFieldNames', 6, { modelName }, config);
};

export const addNote = async (
  noteData: { title: string; note: string; screenshotBase64: string; tags: string[] },
  config: AnkiConfig
) => {
  const fields: Record<string, string> = {};
  
  // Clean base64 for Anki (remove data:image/png;base64, prefix if present)
  const base64Data = noteData.screenshotBase64.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
  const filename = `flashgen_${Date.now()}.png`;

  // Upload image first
  await invoke('storeMediaFile', 6, {
     filename: filename,
     data: base64Data
  }, config);

  // Map fields
  const { fieldMapping } = config;
  
  if (fieldMapping.title && noteData.title) fields[fieldMapping.title] = noteData.title;
  if (fieldMapping.note && noteData.note) fields[fieldMapping.note] = noteData.note.replace(/\n/g, '<br>');
  if (fieldMapping.screenshot) fields[fieldMapping.screenshot] = `<img src="${filename}">`;

  const params = {
    note: {
      deckName: config.deckName,
      modelName: config.modelName,
      fields: fields,
      tags: noteData.tags || []
    }
  };

  return invoke('addNote', 6, params, config);
};