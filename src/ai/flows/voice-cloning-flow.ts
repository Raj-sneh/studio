'use server';
/**
 * Professional Voice Cloning & Vocal Replacement flows using SKV AI (Gemini 2.5 Flash) + ElevenLabs.
 * Implements a full separation/replacement/remix pipeline with "Singer Filter" logic.
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
  clive: 'JBFqnCBsd6RMkjVDRZzb', // George
  clara: '21m00Tcm4TlvDq8ikWAM', // Rachel
  james: 'ErXwUjzD4qc0CPByOn9G', // Antoni
  alex: 'Lcf7eeY9feMlh8o4NoOf', // Charlie
};

/**
 * Dynamic URL helper to ensure the server picks up the correct environment variable.
 */
function getBaseUrl() {
  return process.env.NEURAL_ENGINE_URL || process.env.NEXT_PUBLIC_NEURAL_ENGINE_URL || "http://localhost:8080";
}

/**
 * Checks if the Python Backend is awake before sending heavy tasks.
 * Retries up to 30 times with a 2-second delay (60 seconds total).
 */
async function waitForBackend() {
  const baseUrl = getBaseUrl();
  console.log("SKV AI: Checking Neural Engine status at:", baseUrl);

  for (let i = 0; i < 30; i++) { 
    try {
      const res = await fetch(`${baseUrl}/api/status`, { cache: 'no-store' });
      if (res.ok) {
        console.log("SKV AI: Neural Engine is ONLINE.");
        return true;
      }
    } catch (e) {
      console.log(`SKV AI: Waiting for backend wake up... Attempt ${i+1}/30`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error(`Neural Engine (Python) is not responding at ${baseUrl}. Please ensure the Python server is running.`);
}

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
  prompt: `You are an expert voice director for SKV AI. Enhance this text for a natural, expressive performance. 
  Add punctuation (dashes, ellipsis) where pauses would naturally occur to ensure a human-like flow. Do not change the core meaning.
  Text: {{text}}`,
});

/**
 * AI Director for "Singer Filter" logic.
 */
const singerDirectorPrompt = ai.definePrompt({
  name: 'singerDirectorPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: {
    schema: z.object({
      vocalDataUri: z.string().describe('The isolated vocal track to analyze.')
    })
  },
  output: {
    schema: z.object({
      suggestedStability: z.number().describe('Neural stability setting (0.0 to 1.0).'),
      suggestedSimilarity: z.number().describe('Neural similarity setting (0.0 to 1.0).'),
      expressionLevel: z.string().describe('Description of the singing style.')
    })
  },
  prompt: `You are the SKV AI Musical Director. Analyze this isolated vocal track.
  Suggest the perfect Stability and Similarity Boost settings for an ElevenLabs Speech-to-Speech conversion to ensure the output sounds like a professional singer.
  
  Vocal Sample: {{media url=vocalDataUri}}`,
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
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', analysis.description);

    for (let i = 0; i < samples.length; i++) {
        const base64Data = samples[i].split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: 'audio/wav' });
        formData.append('files', blob, `sample_${i}.wav`);
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail?.message || "Cloning failed.");

    return { 
      voiceId: data.voice_id,
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
        if (!apiKey) throw new Error("ElevenLabs API key is missing.");

        const actualVoiceId = DEFAULT_VOICE_MAP[voiceId] || voiceId;

        const enhancement = await enhancePerformancePrompt({ text });
        const optimizedText = enhancement.output?.enhancedText || text;

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${actualVoiceId}`, {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: optimizedText,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: settings?.stability ?? 0.5,
                    similarity_boost: settings?.similarity_boost ?? 0.75,
                }
            }),
        });

        if (!response.ok) throw new Error("TTS failed.");

        const buffer = Buffer.from(await response.arrayBuffer());
        return { audioUri: `data:audio/mpeg;base64,${buffer.toString('base64')}` };
    }
);

/**
 * PRO PIPELINE: Separate -> Analyze -> Replace -> Mix
 */
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

        const actualVoiceId = DEFAULT_VOICE_MAP[voiceId] || voiceId;
        const baseUrl = getBaseUrl();
        
        await waitForBackend();

        const base64Content = audioDataUri.split(',')[1];
        const inputBlob = new Blob([Buffer.from(base64Content, 'base64')], { type: 'audio/wav' });
        const separateFormData = new FormData();
        separateFormData.append('audio', inputBlob, 'input.wav');

        const separateResponse = await fetch(`${baseUrl}/separate`, {
            method: 'POST',
            body: separateFormData
        });

        if (!separateResponse.ok) throw new Error("Neural separation engine failed.");
        
        const { vocals, bgm } = await separateResponse.json();

        const directorAnalysis = await singerDirectorPrompt({ vocalDataUri: vocals });
        const analysis = directorAnalysis.output!;

        const vBuffer = Buffer.from(vocals.split(',')[1], 'base64');
        const vBlob = new Blob([vBuffer], { type: 'audio/wav' });

        const stsFormData = new FormData();
        stsFormData.append('audio', vBlob, 'vocals.wav');
        stsFormData.append('model_id', 'eleven_multilingual_sts_v2'); 
        stsFormData.append('voice_settings', JSON.stringify({
            stability: settings?.stability ?? analysis.suggestedStability,
            similarity_boost: settings?.similarity_boost ?? analysis.suggestedSimilarity, 
        }));

        const stsResponse = await fetch(`https://api.elevenlabs.io/v1/speech-to-speech/${actualVoiceId}`, {
            method: 'POST',
            headers: { 'xi-api-key': apiKey },
            body: stsFormData,
        });

        if (!stsResponse.ok) throw new Error(`Vocal synthesis failed during neural transformation.`);

        const aiVocalBlob = new Blob([Buffer.from(await stsResponse.arrayBuffer())], { type: 'audio/mpeg' });

        const mixFormData = new FormData();
        mixFormData.append('vocals', aiVocalBlob, 'ai_vocals.mp3');
        const bgmBlob = new Blob([Buffer.from(bgm.split(',')[1], 'base64')], { type: 'audio/wav' });
        mixFormData.append('bgm', bgmBlob, 'original_bgm.wav');

        const mixResponse = await fetch(`${baseUrl}/mix`, {
            method: 'POST',
            body: mixFormData
        });

        if (!mixResponse.ok) throw new Error("Mastering stage failed.");

        const finalBuffer = Buffer.from(await mixResponse.arrayBuffer());
        return { audioUri: `data:audio/mpeg;base64,${finalBuffer.toString('base64')}` };
    }
);
