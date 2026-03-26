'use server';
/**
 * Professional Voice Cloning & Vocal Replacement flows using SKV AI (Gemini 2.5 Flash) + ElevenLabs.
 * ElevenLabs is used for neural cloning and high-fidelity synthesis (sounding like the user).
 * Gemini handles analysis, structuring, and linguistic optimization for different languages.
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
 * Mapping of friendly UI names to real ElevenLabs Studio Voice IDs.
 */
const DEFAULT_VOICE_MAP: Record<string, string> = {
  clive: 'JBFqnCBsd6RMkjVDRZzb', // George (Master)
  clara: '21m00Tcm4TlvDq8ikWAM', // Rachel
  james: 'ErXwUjzD4qc0CPByOn9G', // Antoni
  alex: 'Lcf7eeY9feMlh8o4NoOf', // Charlie
};

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

/**
 * Uses SKV AI to optimize text for a natural neural performance.
 */
const enhancePerformancePrompt = ai.definePrompt({
  name: 'enhancePerformancePrompt',
  model: 'googleai/gemini-2.5-flash',
  input: {
    schema: z.object({
      text: z.string(),
      language: z.string().optional()
    })
  },
  output: {
    schema: z.object({
      enhancedText: z.string().describe('The text optimized for natural speech with emotional punctuation.')
    })
  },
  prompt: `You are an expert voice director for SKV AI. Enhance this text for a natural, expressive performance in {{#if language}}{{language}}{{else}}the original language{{/if}}. 
  Add punctuation (dashes, ellipsis) where pauses would naturally occur to ensure a human-like flow. Do not change the core meaning.
  Text: {{text}}`,
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

    // Analyze first sample for description using SKV AI
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

        // Step 1: Map friendly ID to real ElevenLabs ID if needed
        const actualVoiceId = DEFAULT_VOICE_MAP[voiceId] || voiceId;

        // Step 2: Use SKV AI to structure and enhance the performance
        const enhancement = await enhancePerformancePrompt({ text });
        const optimizedText = enhancement.output?.enhancedText || text;

        // Step 3: Use ElevenLabs for the actual audio generation to ensure it sounds like the user
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${actualVoiceId}`, {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: optimizedText,
                model_id: 'eleven_multilingual_v2', // v2 is superior for preserving user voice character in global languages
                voice_settings: {
                    stability: settings?.stability ?? 0.5,
                    similarity_boost: settings?.similarity_boost ?? 0.75,
                }
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail?.message || `TTS failed with status ${response.status}.`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
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
        const { audioDataUri, voiceId, settings, language } = input;
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) throw new Error("ElevenLabs API key is missing.");

        // Step 1: Map friendly ID to real ElevenLabs ID if needed
        const actualVoiceId = DEFAULT_VOICE_MAP[voiceId] || voiceId;

        // Step 2: Decode source audio
        const base64Data = audioDataUri.split(',')[1];
        const audioBuffer = Buffer.from(base64Data, 'base64');
        const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });

        // Step 3: Prepare multipart form for Speech-to-Speech
        const formData = new FormData();
        formData.append('audio', audioBlob, 'source.mp3');
        formData.append('model_id', 'eleven_v3'); // v3 is ultra-high fidelity for pitch/melody preservation
        formData.append('voice_settings', JSON.stringify({
            stability: settings?.stability ?? 0.5,
            similarity_boost: settings?.similarity_boost ?? 0.75,
        }));

        // Step 4: Execute Neural Voice Conversion
        const response = await fetch(`https://api.elevenlabs.io/v1/speech-to-speech/${actualVoiceId}`, {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail?.message || `Vocal replacement failed with status ${response.status}.`);
        }

        const outArrayBuffer = await response.arrayBuffer();
        const outBuffer = Buffer.from(outArrayBuffer);
        return { audioUri: `data:audio/mpeg;base64,${outBuffer.toString('base64')}` };
    }
);
