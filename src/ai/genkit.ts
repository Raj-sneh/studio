import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import 'dotenv/config';

// Log a warning if the API key is not found in local development.
// In a deployed environment, Genkit will use the secret manager.
if (process.env.NODE_ENV !== 'production' && !process.env.GEMINI_API_KEY) {
  console.warn(
    'GEMINI_API_KEY is not defined in your environment variables. AI features may not work locally.'
  );
}

const geminiApiKey =
  process.env.NODE_ENV === 'production'
    ? 'GEMINI_API_KEY' // In production, use the secret name
    : process.env.GEMINI_API_KEY; // In development, use the value from .env.local or similar

export const ai = genkit({
  plugins: [
    googleAI({
      // The API key is sourced from the GEMINI_API_KEY secret in production.
      // In local development, it uses the value from an environment variable.
      apiKey: geminiApiKey,
    }),
  ],
});
