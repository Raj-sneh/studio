import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {firebaseConfig} from '@/firebase/config';

export const ai = genkit({
  plugins: [googleAI({ apiVersion: 'v1' })],
  model: 'gemini-2.0-flash',
  projectId: firebaseConfig.projectId,
});
