import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {firebaseConfig} from '@/firebase/config';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-flash-latest',
  projectId: firebaseConfig.projectId,
});
