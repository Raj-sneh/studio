import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { firebaseConfig } from '@/firebase/config';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1', 
      apiKey: process.env.GEMINI_API_KEY
    })
  ],
  model: 'gemini-1.5-flash', 
  projectId: firebaseConfig.projectId,
});
