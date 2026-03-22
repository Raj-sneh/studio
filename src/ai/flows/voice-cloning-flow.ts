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

    // Resolve URL - prioritize 127.0.0.1 over localhost for Node.js fetch reliability
    let VOICE_ENGINE_URL = process.env.VOICE_ENGINE_URL || 'http://127.0.0.1:8080/clone';
    
    // Node.js 18+ fetch often fails to resolve 'localhost' to 127.0.0.1 automatically.
    // We force the replacement to ensure we hit the IPv4 loopback address.
    if (VOICE_ENGINE_URL.includes('localhost')) {
      VOICE_ENGINE_URL = VOICE_ENGINE_URL.replace('localhost', '127.0.0.1');
    }

    try {
      console.log(`Attempting to connect to voice engine at: ${VOICE_ENGINE_URL}`);
      
      const response = await fetch(VOICE_ENGINE_URL, {
        method: 'POST',
        body: formData,
        // Increase timeout for slow XTTS/Voice processing (90 seconds)
        signal: AbortSignal.timeout(90000), 
      });

      if (!response.ok) {
        let errorMessage = `Voice engine returned status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
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
        name: error.name
      });
      
      let clientMessage = "The voice engine is currently unavailable.";
      
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        clientMessage = "The voice generation timed out. Please ensure the Python server is responding.";
      } else if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
        clientMessage = `Could not connect to the voice engine at ${VOICE_ENGINE_URL}. Please ensure the Python server (app.py) is running on port 8080.`;
      } else {
        clientMessage = `Voice Synthesis Error: ${error.message}`;
      }
      
      throw new Error(clientMessage);
    }
  }
);
