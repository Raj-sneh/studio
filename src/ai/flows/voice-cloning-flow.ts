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
 * Communicates with the external voice engine (Flask).
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
    
    // Field name 'audio' must match what the Flask app expects
    formData.append('audio', blob, 'sample.wav');
    formData.append('text', text);

    // Prioritize 127.0.0.1 for Node.js reliability
    let VOICE_ENGINE_URL = process.env.VOICE_ENGINE_URL || 'http://127.0.0.1:8080/clone';
    
    if (VOICE_ENGINE_URL.includes('localhost')) {
      VOICE_ENGINE_URL = VOICE_ENGINE_URL.replace('localhost', '127.0.0.1');
    }

    try {
      console.log(`Connecting to voice engine: ${VOICE_ENGINE_URL}`);
      
      const response = await fetch(VOICE_ENGINE_URL, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(90000), 
      });

      if (!response.ok) {
        let errorMessage = `Engine returned error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
      }

      const audioBuffer = await response.arrayBuffer();
      if (!audioBuffer || audioBuffer.byteLength === 0) {
        throw new Error("The voice engine produced an empty file.");
      }
      
      const outputBase64 = Buffer.from(audioBuffer).toString('base64');

      return {
        clonedAudioUri: `data:audio/mpeg;base64,${outputBase64}`,
      };
    } catch (error: any) {
      console.error("Voice Cloning Error:", error.message);
      
      let clientMessage = "The voice engine is currently offline.";
      
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        clientMessage = "The generation timed out. Try a shorter script.";
      } else if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
        clientMessage = `Could not connect to the voice engine at ${VOICE_ENGINE_URL}. Ensure your Python app is running on port 8080.`;
      } else {
        clientMessage = `Synthesis Error: ${error.message}`;
      }
      
      throw new Error(clientMessage);
    }
  }
);
