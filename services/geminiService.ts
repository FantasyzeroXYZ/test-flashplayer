import { GoogleGenAI, Type } from "@google/genai";
import { FlashSceneData } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getWordDefinition = async (word: string, targetLanguage: string): Promise<string> => {
  const modelId = "gemini-2.5-flash";
  const prompt = `Define the word or phrase "${word}" briefly and clearly in ${targetLanguage}. If it's a foreign word, provide pronunciation and translation. Keep it concise (under 50 words).`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    return response.text || "No definition found.";
  } catch (error) {
    console.error("Dictionary Error:", error);
    return "Error fetching definition.";
  }
};

export const generateFlashScene = async (prompt: string): Promise<FlashSceneData> => {
  const modelId = "gemini-2.5-flash";

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "A short, catchy title for the animation (e.g., 'Stick Fight 2005').",
      },
      backgroundColor: {
        type: Type.STRING,
        description: "Hex color code for the background (e.g., '#FFFFFF', '#000000', '#336699').",
      },
      viewBox: {
        type: Type.STRING,
        description: "SVG viewBox attribute (e.g., '0 0 550 400'). Standard Flash size is often 550x400.",
      },
      svgContent: {
        type: Type.STRING,
        description: "The INNER HTML of the SVG tag. Use standard SVG elements (<rect>, <circle>, <path>, <text>, <g>). CRITICAL: Use <animate>, <animateTransform>, and <animateMotion> tags to create movement, rotation, and fading. Make it look like a Flash animation.",
      },
    },
    required: ["title", "backgroundColor", "viewBox", "svgContent"],
  };

  const systemInstruction = `
    You are a legendary Flash Animator from 2005. 
    Your goal is to generate SVG code that mimics the aesthetic of early internet Flash animations (Newgrounds, stick figures, simple gradients, bold strokes).
    
    Rules:
    1. Output ONLY valid SVG inner XML content for the 'svgContent' field. Do not include the <svg> wrapper tag.
    2. Use <animate>, <animateTransform> to make things move. Static images are boring.
    3. Keep the style "vector" and "cartoonish".
    4. If the user asks for a game, simulate a gameplay scene (e.g., a character jumping over a spike).
    5. Be creative with gradients (<defs><linearGradient...>) to mimic the "web 2.0" glossy look.
    6. Ensure all IDs in the SVG are unique to avoid conflicts.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7, 
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as FlashSceneData;
    }
    throw new Error("No text returned from Gemini");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};