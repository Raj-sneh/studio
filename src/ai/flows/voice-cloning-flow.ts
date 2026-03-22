'use server';
/**
 * @fileOverview A Genkit flow that connects the Next.js app to the Python Voice Engine.
 */

import { ai } from '@/ai/genkit';
import {
  VoiceCloningInputSchema,
  VoiceCloningOutputSchema,
  type VoiceCloningInput,
  type VoiceCloningOutput,
} from './voice-cloning-types';

/**
 * Communicates with the external XTTS Voice Engine.
 */
export async function cloneVoice(input: VoiceCloningInput): Promise<VoiceCloningOutput> {
  return voiceCloningFlow(input);
}

const voiceCloningFlow = ai.defineFlow(
  {
    name: 'voiceCloningFlow',
    inputSchema: VoiceCloningInputSchema,
    outputSchema: VoiceCloningOutputSchema,
  },
  async (input) => {
    const { text, sampleAudioDataUri } = input;

    // Convert Data URI to Buffer for the POST request
    const base64Data = sampleAudioDataUri.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    // Create Form Data to send to the Flask server
    const formData = new FormData();
    const blob = new Blob([buffer], { type: 'audio/wav' });
    // Changed 'sample' to 'audio' to match updated main.py
    formData.append('audio', blob, 'sample.wav');
    formData.append('text', text);

    // Call the external Voice Engine (Flask server)
    const VOICE_ENGINE_URL = process.env.VOICE_ENGINE_URL || 'http://localhost:8080/clone';

    try {
      const response = await fetch(VOICE_ENGINE_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Voice engine returned status ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const outputBase64 = Buffer.from(audioBuffer).toString('base64');

      return {
        clonedAudioUri: `data:audio/wav;base64,${outputBase64}`,
      };
    } catch (error: any) {
      console.error("Voice Cloning Engine Error:", error);
      throw new Error(`The voice engine is currently unavailable: ${error.message}`);
    }
  }
);