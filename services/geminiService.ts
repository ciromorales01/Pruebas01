
import { GoogleGenAI } from "@google/genai";
import { KnowledgeItem, Message, AppSettings } from "../types";

const getApiKey = () => {
  // 1. Intentar obtenerla del proceso (inyectada por Vite durante la compilación)
  const key = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (key) return key;

  // 2. Intentar obtenerla de window.process (inyectada por el servidor en tiempo de ejecución en producción)
  const win = window as any;
  return win.process?.env?.GEMINI_API_KEY || win.process?.env?.API_KEY || '';
};

export const generateResponse = async (
  userMessage: string,
  history: Message[],
  knowledgeBase: KnowledgeItem[],
  language: 'es' | 'en',
  settings: AppSettings
) => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error(language === 'es' 
      ? "No se ha configurado la API Key de Gemini." 
      : "Gemini API Key is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Limit knowledge base based on settings
  const relevantDocs = knowledgeBase.slice(0, settings.ragLimit);

  const context = relevantDocs.length > 0 
    ? relevantDocs.map(item => `DOCUMENTO: ${item.title}\nCONTENIDO: ${item.content}`).join('\n\n---\n\n')
    : (language === 'es' ? "No hay documentos cargados." : "No documents loaded.");

  const languageInstruction = language === 'es' 
    ? "Responde siempre en ESPAÑOL (UTF-8). Usa tildes y ñ."
    : "Always respond in ENGLISH (UTF-8).";

  const systemInstruction = `
    ${settings.systemInstruction}
    ${languageInstruction}
    
    BASE DE CONOCIMIENTOS (RAG):
    ${context}

    Instrucciones adicionales:
    1. Usa Google Search si preguntan por hardware/computadoras o información reciente.
    2. Prioriza la Base de Conocimientos para lo demás.
  `;

  // Filter history based on settings
  const recentHistory = history.slice(-settings.historyLimit);
  const contents = [
    ...recentHistory.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    })),
    { role: 'user', parts: [{ text: userMessage }] }
  ];

  try {
    const response = await ai.models.generateContent({
      model: settings.model || 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: settings.temperature,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "No response";
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || 'Fuente',
      uri: chunk.web?.uri || '#'
    })).filter((s: any) => s.uri !== '#') || [];

    return { text, sources };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
