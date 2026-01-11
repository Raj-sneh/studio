import { genkit, type Plugin } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import 'dotenv/config';

const plugins: Plugin<any>[] = [];

if (process.env.NODE_ENV === 'production') {
  plugins.push(googleAI({ apiKey: process.env.GEMINI_API_KEY }));
} else {
  // In development, it's okay to use the API key from .env or .env.local
  if (process.env.GEMINI_API_KEY) {
    plugins.push(googleAI({ apiKey: process.env.GEMINI_API_KEY }));
  } else {
    console.warn(
      'GEMINI_API_KEY not found in environment variables. AI features will be disabled.'
    );
  }
}

export const ai = genkit({
  plugins,
  enableTracingAndMetrics: process.env.NODE_ENV === 'production',
});
