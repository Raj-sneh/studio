
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Genkit initialization file.
 * 
 * This file configures Genkit 1.x with the Google AI plugin.
 * The exported `ai` object is the central entry point for all AI functionality.
 */

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
