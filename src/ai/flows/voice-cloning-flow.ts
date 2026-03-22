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
    
    // The key 'audio' must match what the Flask app expects in request.files.get("audio")
    formData.append('audio', blob, 'sample.wav');
    formData.append('text', text);

    // Call the external Voice Engine (Flask server)
    // Defaulting to 127.0.0.1 as it is often more stable than 'localhost' in Node.js fetch environments
    const VOICE_ENGINE_URL = process.env.VOICE_ENGINE_URL || 'http://127.0.0.1:8080/clone';

    try {
      console.log(`Attempting to connect to voice engine at: ${VOICE_ENGINE_URL}`);
      
      const response = await fetch(VOICE_ENGINE_URL, {
        method: 'POST',
        body: formData,
        // Increase timeout for slow XTTS/Voice processing
        signal: AbortSignal.timeout(60000), 
      });

      if (!response.ok) {
        let errorMessage = `Voice engine returned status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response isn't JSON, just use the status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const audioBuffer = await response.arrayBuffer();
      if (!audioBuffer || audioBuffer.byteLength === 0) {
        throw new Error("Voice engine returned an empty audio file.");
      }
      
      const outputBase64 = Buffer.from(audioBuffer).toString('base64');

      return {
        clonedAudioUri: `data:audio/mpeg;base64,${outputBase64}`,
      };
    } catch (error: any) {
      console.error("Voice Cloning Engine Connection Error:", {
        message: error.message,
        url: VOICE_ENGINE_URL,
        stack: error.stack
      });
      
      let clientMessage = "The voice engine is currently unavailable.";
      if (error.name === 'TimeoutError') {
        clientMessage = "The voice generation timed out. Please try a shorter text.";
      } else if (error.message.includes('fetch failed')) {
        clientMessage = `Could not connect to the voice engine at ${VOICE_ENGINE_URL}. Please ensure the Python server is running.`;
      } else {
        clientMessage = `Voice Synthesis Error: ${error.message}`;
      }
      
      throw new Error(clientMessage);
    }
  }
);
