import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import 'dotenv/config';
import { firebase } from '@genkit-ai/firebase';

// Log a warning if the API key is not found in local development.
// In a deployed environment, Genkit will use the secret manager.
if (process.env.NODE_ENV !== 'production' && !process.env.GEMINI_API_KEY) {
  console.warn(
    'GEMINI_API_KEY is not defined in your environment variables for local development. AI features may not work.'
  );
}

export const ai = genkit({
  plugins: [
    firebase(),
    googleAI({
      // The API key is sourced from the GEMINI_API_KEY secret in production.
      // In local development, it uses the value from .env.local.
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  // Log to the Firebase console in production
  // and to the console in development.
  logSinker: 'firebase',
  // In production, we need to use a real flow state store.
  flowStateStore: 'firebase',
});
