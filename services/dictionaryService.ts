export interface DictionaryDefinition {
  word: string;
  phonetic?: string;
  phonetics: Array<{
    text?: string;
    audio?: string;
  }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms: string[];
      antonyms: string[];
    }>;
  }>;
}

const API_BASE_URL = 'https://freedictionaryapi.com/api/v1/entries';

export const fetchDefinition = async (word: string, language: string): Promise<DictionaryDefinition[] | null> => {
  try {
    // API structure: /entries/{language}/{word}
    const response = await fetch(`${API_BASE_URL}/${language}/${encodeURIComponent(word)}`);
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    // The API spec returns EntriesByLanguageAndWord object which has 'entries' array. 
    // However, common FreeDictionaryAPI forks sometimes return array directly.
    // Based on provided Spec: 
    // Response { word: string, entries: Entry[], source: ... }
    
    if (data && data.entries) {
        // Transform spec format to a simpler generic format for UI if needed, 
        // or return as is. For now, let's map it loosely to what our UI might expect.
        // The Spec 'Entry' has { senses: [{ definition: ... }] }
        
        return data.entries.map((entry: any) => ({
            word: data.word,
            phonetic: entry.pronunciations?.[0]?.text,
            phonetics: entry.pronunciations || [],
            meanings: [{
                partOfSpeech: entry.partOfSpeech,
                definitions: entry.senses?.map((s: any) => ({
                    definition: s.definition,
                    example: s.examples?.[0],
                })) || []
            }]
        }));
    } 
    
    // Fallback if the API behaves like the google-dictionary-api fork (just in case)
    if (Array.isArray(data)) return data;

    return null;

  } catch (error) {
    console.error("Dictionary Service Error:", error);
    return null;
  }
};