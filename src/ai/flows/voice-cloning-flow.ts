
'use server';
/**
 * Professional Voice Cloning & Vocal Replacement flows using ElevenLabs API.
 * Uses SKV AI for neural analysis and ElevenLabs Multilingual v2 for high-fidelity synthesis.
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
  VocalReplacementInputSchema,
  VocalReplacementOutputSchema,
  type VocalReplacementInput,
  type VocalReplacementOutput,
} from './voice-cloning-types';

/**
 * Uses SKV AI to analyze a voice sample for neural cloning.
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
      description: z.string().describe('Detailed vocal description. Max 400 chars.'),
      suggestedStability: z.number(),
      suggestedSimilarity: z.number(),
    })
  },
  prompt: `Analyze this vocal sample. Describe the voice tone, age, gender, and clarity.
  Keep description under 400 chars. Suggest Stability and Similarity settings for ElevenLabs.
  Sample: {{media url=sampleDataUri}}`,
});

export async function cloneVoice(input: VoiceCloningInput): Promise<VoiceCloningOutput> {
  return voiceCloningFlow(input);
}

export async function speakWithClone(input: CloneSpeechInput): Promise<CloneSpeechOutput> {
    return speakWithCloneFlow(input);
}

export async function replaceVocals(input: VocalReplacementInput): Promise<VocalReplacementOutput> {
    return vocalReplacementFlow(input);
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

    if (!apiKey) throw new Error("ElevenLabs API key is missing.");

    const analysisResponse = await analyzeVoicePrompt({ sampleDataUri: samples[0] });
    const analysis = analysisResponse.output!;
    
    const finalDescription = analysis.description.length > 480 
      ? analysis.description.substring(0, 477) + "..." 
      : analysis.description;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', finalDescription);

    for (let i = 0; i < samples.length; i++) {
        const dataUri = samples[i];
        const base64Data = dataUri.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: 'audio/mpeg' });
        formData.append('files', blob, `sample_${i}.mp3`);
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail?.message || "Cloning failed.");
    }

    const result = await response.json();
    return { 
      voiceId: result.voice_id,
      description: finalDescription,
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
        if (!apiKey) throw new Error("ElevenLabs API key is missing.");

        // Using eleven_multilingual_v2 for consistent quality across all languages
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_multilingual_v2', 
                voice_settings: settings
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail?.message || "TTS generation failed.");
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        return { audioUri: `data:audio/mpeg;base64,${buffer.toString('base64')}` };
    }
);

const vocalReplacementFlow = ai.defineFlow(
    {
        name: 'vocalReplacementFlow',
        inputSchema: VocalReplacementInputSchema,
        outputSchema: VocalReplacementOutputSchema,
    },
    async (input) => {
        const { audioDataUri, voiceId, settings } = input;
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) throw new Error("ElevenLabs API key is missing.");

        const base64Data = audioDataUri.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: 'audio/mpeg' });

        const formData = new FormData();
        formData.append('audio', blob, 'input.mp3');
        
        // CRITICAL: Using 'eleven_multilingual_v2' for speech-to-speech
        // v3 is optimized for TTS, but v2 remains the standard for STS (voice conversion)
        formData.append('model_id', 'eleven_multilingual_v2'); 
        
        if (settings) {
            formData.append('voice_settings', JSON.stringify(settings));
        }

        const response = await fetch(`https://api.elevenlabs.io/v1/speech-to-speech/${voiceId}`, {
            method: 'POST',
            headers: { 'xi-api-key': apiKey },
            body: formData,
        });

        if (!response.ok) {
            let errorMessage = `Vocal replacement failed with status ${response.status}.`;
            try {
                const errorJson = await response.json();
                errorMessage = errorJson.detail?.message || errorMessage;
            } catch (e) {
                // If response is not JSON, keep default message
            }
            throw new Error(errorMessage);
        }

        const outBuffer = Buffer.from(await response.arrayBuffer());
        return { audioUri: `data:audio/mpeg;base64,${outBuffer.toString('base64')}` };
    }
);
