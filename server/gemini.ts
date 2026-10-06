import { GoogleGenAI } from '@google/genai';

// Initialize the shared GoogleGenAI client on the server side
// The User-Agent header must be 'aistudio-build'
export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export const GEMINI_MODEL = 'gemini-3.8-flash';
