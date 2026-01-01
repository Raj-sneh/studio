import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import 'dotenv/config';

// Log a warning if the API key is not found. This helps in debugging.
if (!process.env.GEMINI_API_KEY) {
  console.warn(
    'GEMINI_API_KEY is not defined in your environment variables. AI features may not work.'
  );
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
});
