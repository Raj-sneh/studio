import { genkit, type Plugin } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { firebase } from "@genkit-ai/firebase";
import 'dotenv/config';

const geminiApiKey = process.env.GEMINI_API_KEY || 'GEMINI_API_KEY';

const plugins: Plugin<any>[] = [
  googleAI({
    apiKey: geminiApiKey,
  }),
];

if (process.env.NODE_ENV === 'production') {
  plugins.push(firebase());
}

export const ai = genkit({
  plugins,
  logSinker: process.env.NODE_ENV === 'production' ? 'firebase' : undefined,
  flowStateStore: process.env.NODE_ENV === 'production' ? 'firebase' : undefined,
});
