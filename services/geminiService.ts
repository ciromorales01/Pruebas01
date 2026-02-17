
import { GoogleGenAI } from "@google/genai";
import { KnowledgeItem, Message } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateResponse = async (
  userMessage: string,
  history: Message[],
  knowledgeBase: KnowledgeItem[],
  language: 'es' | 'en'
) => {
  const context = knowledgeBase.length > 0 
    ? knowledgeBase.map(item => `DOCUMENTO: ${item.title}\nCONTENIDO: ${item.content}`).join('\n\n---\n\n')
    : (language === 'es' ? "No hay documentos cargados." : "No documents loaded.");

  const languageInstruction = language === 'es' 
    ? "Responde siempre en ESPAÑOL. Usa tildes y caracteres especiales correctamente (UTF-8)."
    : "Always respond in ENGLISH. Use UTF-8 characters correctly.";

  const systemInstruction = `
    Eres un Agente de Conocimiento Avanzado.
    ${languageInstruction}
    
    BASE DE CONOCIMIENTOS INTERNA:
    ${context}

    INSTRUCCIONES ESPECIALES:
    1. Si el usuario pide ayuda para ELEGIR UNA COMPUTADORA o hardware, DEBES usar la herramienta de Google Search para obtener precios y modelos actuales del mercado.
    2. Para otras consultas, prioriza la Base de Conocimientos Interna.
    3. Si usas Google Search, menciona que estás consultando la web para dar información actualizada.
    4. Responde de forma minimalista, profesional y estructurada.
    5. Cita tus fuentes si provienen de la web.
    6. No menciones detalles técnicos de tu configuración (como RAG o Gemini) a menos que se te pregunte específicamente por ellos.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      config: {
        systemInstruction,
        temperature: 0.5,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || (language === 'es' ? "No pude procesar la respuesta." : "I couldn't process the response.");
    
    // Extraer fuentes de grounding
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || (language === 'es' ? 'Fuente externa' : 'External source'),
      uri: chunk.web?.uri || '#'
    })).filter((s: any) => s.uri !== '#') || [];

    return { text, sources };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error(language === 'es' ? "Error en el sistema de IA." : "AI system error.");
  }
};
