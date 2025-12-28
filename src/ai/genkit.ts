import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {firebaseConfig} from '@/firebase/config';

export const ai = genkit({
  plugins: [googleAI({ apiVersion: 'v1beta' })],
  model: 'gemini-2.0-flash',
  projectId: firebaseConfig.projectId,
});
