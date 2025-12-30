
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import 'dotenv/config';

// Explicitly get the API key from environment variables.
const geminiApiKey = process.env.GEMINI_API_KEY;

// Log a warning if the API key is not found. This helps in debugging.
if (!geminiApiKey) {
  console.warn(
    'GEMINI_API_KEY is not defined in your environment variables. AI features will not work.'
  );
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1',
      apiKey: geminiApiKey,
    })
  ],
  model: 'gemini-1.5-flash',
  // Set the project ID directly to avoid import issues.
  projectId: 'studio-4164192500-5d49e',
});
