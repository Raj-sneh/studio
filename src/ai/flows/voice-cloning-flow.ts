'use server';
/**
 * @fileOverview Professional Voice Cloning flow using ElevenLabs API.
 */

import { ai } from '@/ai/genkit';
import {
  VoiceCloningInputSchema,
  VoiceCloningOutputSchema,
  type VoiceCloningInput,
  type VoiceCloningOutput,
  CloneSpeechInputSchema,
  CloneSpeechOutputSchema,
  type CloneSpeechInput,
  type CloneSpeechOutput,
} from './voice-cloning-types';

/**
 * Creates a voice clone on ElevenLabs using recorded samples.
 */
export async function cloneVoice(input: VoiceCloningInput): Promise<VoiceCloningOutput> {
  return voiceCloningFlow(input);
}

/**
 * Generates speech using a previously cloned ElevenLabs Voice ID.
 */
export async function speakWithClone(input: CloneSpeechInput): Promise<CloneSpeechOutput> {
    return speakWithCloneFlow(input);
}

const voiceCloningFlow = ai.defineFlow(
  {
    name: 'voiceCloningFlow',
    inputSchema: VoiceCloningInputSchema,
    outputSchema: VoiceCloningOutputSchema,
  },
  async (input) => {
    const { name, samples } = input;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      throw new Error("ElevenLabs API key is missing. Please add it to your .env file.");
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', 'Sargam AI Professional Clone');

    // Convert data URIs to Blobs and append to form data
    for (let i = 0; i < samples.length; i++) {
        const dataUri = samples[i];
        const mimeType = dataUri.split(',')[0].split(':')[1].split(';')[0];
        const base64Data = dataUri.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: mimeType });
        formData.append('files', blob, `sample_${i}.wav`);
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail?.message || `ElevenLabs API Error: ${response.status}`);
    }

    const result = await response.json();
    return { voiceId: result.voice_id };
  }
);

const speakWithCloneFlow = ai.defineFlow(
    {
        name: 'speakWithCloneFlow',
        inputSchema: CloneSpeechInputSchema,
        outputSchema: CloneSpeechOutputSchema,
    },
    async (input) => {
        const { text, voiceId } = input;
        const apiKey = process.env.ELEVENLABS_API_KEY;

        if (!apiKey) {
            throw new Error("ElevenLabs API key is missing.");
        }

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
                'accept': 'audio/mpeg',
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                }
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail?.message || "Generation failed.");
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Audio = buffer.toString('base64');

        return {
            audioUri: `data:audio/mpeg;base64,${base64Audio}`,
        };
    }
);
