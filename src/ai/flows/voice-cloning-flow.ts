'use server';
/**
 * Professional Voice Cloning flow using ElevenLabs API enhanced with Gemini Analysis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
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
 * Uses Gemini to analyze a voice sample and suggest settings/descriptions.
 */
const analyzeVoicePrompt = ai.definePrompt({
  name: 'analyzeVoicePrompt',
  model: 'googleai/gemini-2.5-flash',
  input: {
    schema: z.object({
      sampleDataUri: z.string().describe('The audio sample as a data URI.')
    })
  },
  output: {
    schema: z.object({
      description: z.string().describe('A detailed description of the voice tone, pitch, and character.'),
      suggestedStability: z.number().describe('Value between 0 and 1.'),
      suggestedSimilarity: z.number().describe('Value between 0 and 1.'),
    })
  },
  prompt: `You are a professional vocal analyst. Analyze the following voice sample (provided as a data URI in the input).
  
  Describe the voice in detail: its age range, gender, emotional tone, clarity, and any unique characteristics.
  
  Also, suggest the best neural TTS settings for cloning this voice:
  - Stability: Higher for consistent voices, lower for expressive/dynamic voices.
  - Similarity Boost: Higher to capture more nuance, but too high can cause artifacts.
  
  Vocal Sample: {{media url=sampleDataUri}}
  
  Return only the JSON analysis.`,
});

/**
 * Creates a voice clone on ElevenLabs using recorded samples, guided by Gemini analysis.
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

    // 1. Analyze the first sample using Gemini
    const analysisResponse = await analyzeVoicePrompt({ sampleDataUri: samples[0] });
    const analysis = analysisResponse.output!;

    // 2. Add the voice to ElevenLabs
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', analysis.description);

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
    return { 
      voiceId: result.voice_id,
      description: analysis.description,
      suggestedSettings: {
        stability: analysis.suggestedStability,
        similarity_boost: analysis.suggestedSimilarity
      }
    };
  }
);

const speakWithCloneFlow = ai.defineFlow(
    {
        name: 'speakWithCloneFlow',
        inputSchema: CloneSpeechInputSchema,
        outputSchema: CloneSpeechOutputSchema,
    },
    async (input) => {
        const { text, voiceId, settings } = input;
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
                    stability: settings?.stability ?? 0.5,
                    similarity_boost: settings?.similarity_boost ?? 0.75,
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
