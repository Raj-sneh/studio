
'use server';
/**
 * Professional Voice Cloning & Vocal Replacement flows using SKV AI (Gemini 2.5 Flash) + ElevenLabs.
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

const DEFAULT_VOICE_MAP: Record<string, string> = {
  clive: 'JBFqnCBsd6RMkjVDRZzb',
  clara: '21m00Tcm4TlvDq8ikWAM',
  james: 'ErXwUjzD4qc0CPByOn9G',
  alex: 'Lcf7eeY9feMlh8o4NoOf',
};

function getBaseUrl() {
  return process.env.NEURAL_ENGINE_URL || process.env.NEXT_PUBLIC_NEURAL_ENGINE_URL || "http://localhost:8080";
}

async function waitForBackend() {
  const url = getBaseUrl().replace(/\/$/, "");
  console.log("SKV AI: Checking Neural Engine status at:", url);

  for (let i = 0; i < 20; i++) { 
    try {
      const res = await fetch(`${url}/`, { cache: 'no-store' });
      if (res.ok) {
        console.log("SKV AI: Neural Engine is ONLINE.");
        return true;
      }
    } catch (e) {}
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error("Neural Engine is not responding. Please try again in 1 minute.");
}

/** Prompts */
const analyzeVoicePrompt = ai.definePrompt({
  name: 'analyzeVoicePrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: z.object({ sampleDataUri: z.string() }) },
  output: {
    schema: z.object({
      description: z.string(),
      suggestedStability: z.number(),
      suggestedSimilarity: z.number(),
    })
  },
  prompt: `Analyze this vocal sample. Describe tone and clarity. Suggest settings. Sample: {{media url=sampleDataUri}}`,
});

const enhancePerformancePrompt = ai.definePrompt({
  name: 'enhancePerformancePrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: z.object({ text: z.string(), language: z.string().optional() }) },
  output: { schema: z.object({ enhancedText: z.string() }) },
  prompt: `Optimize this text for natural speech: {{text}}`,
});

/** Exported Functions */
export async function cloneVoice(input: VoiceCloningInput): Promise<{ success: boolean; data?: VoiceCloningOutput; error?: string }> {
  try {
    const data = await voiceCloningFlow(input);
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message || "Voice cloning protocol failed." };
  }
}

export async function speakWithClone(input: CloneSpeechInput): Promise<{ success: boolean; data?: CloneSpeechOutput; error?: string }> {
  try {
    const data = await speakWithCloneFlow(input);
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message || "Neural synthesis failed." };
  }
}

export async function replaceVocals(input: VocalReplacementInput): Promise<{ success: boolean; data?: VocalReplacementOutput; error?: string }> {
  try {
    const data = await vocalReplacementFlow(input);
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message || "Vocal replacement failed." };
  }
}

/** Flows */
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

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', "Neural clone created via SKV AI.");

    samples.forEach((uri, i) => {
        // Detect MIME type and extension accurately to prevent corruption
        const mime = uri.split(';')[0].split(':')[1] || 'audio/mpeg';
        const ext = mime.includes('webm') ? 'webm' : mime.includes('ogg') ? 'ogg' : 'wav';
        const buffer = Buffer.from(uri.split(',')[1], 'base64');
        formData.append('files', new Blob([buffer], { type: mime }), `sample_${i}.${ext}`);
    });

    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail?.message || "Cloning failed.");

    return { voiceId: data.voice_id };
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
            headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: optimizedText,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: settings?.stability ?? 0.5,
                    similarity_boost: settings?.similarity_boost ?? 0.75,
                }
            }),
        });

        if (!response.ok) throw new Error("TTS stage failed.");
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
        const { audioDataUri, voiceId } = input;
        const apiKey = process.env.ELEVENLABS_API_KEY;
        const baseUrl = getBaseUrl().replace(/\/$/, "");
        
        await waitForBackend();

        // 1. SEPARATE
        const sepForm = new FormData();
        sepForm.append('audio', new Blob([Buffer.from(audioDataUri.split(',')[1], 'base64')], { type: 'audio/wav' }), 'in.wav');
        const sepRes = await fetch(`${baseUrl}/separate`, { method: 'POST', body: sepForm });
        const { vocals, bgm } = await sepRes.json();

        // 2. TRANSFORM (STS)
        const stsForm = new FormData();
        stsForm.append('audio', new Blob([Buffer.from(vocals.split(',')[1], 'base64')], { type: 'audio/wav' }), 'v.wav');
        stsForm.append('model_id', 'eleven_multilingual_sts_v2');
        stsForm.append('voice_settings', JSON.stringify({ stability: 0.35, similarity_boost: 0.85 }));
        
        const stsRes = await fetch(`https://api.elevenlabs.io/v1/speech-to-speech/${DEFAULT_VOICE_MAP[voiceId] || voiceId}`, {
            method: 'POST',
            headers: { 'xi-api-key': apiKey! },
            body: stsForm
        });

        if (!stsRes.ok) throw new Error("Neural transformation stage failed.");
        const aiVocalBlob = new Blob([Buffer.from(await stsRes.arrayBuffer())], { type: 'audio/mpeg' });

        // 3. MIX
        const mixForm = new FormData();
        mixForm.append('vocals', aiVocalBlob, 'v.mp3');
        mixForm.append('bgm', new Blob([Buffer.from(bgm.split(',')[1], 'base64')], { type: 'audio/wav' }), 'b.wav');
        
        const mixRes = await fetch(`${baseUrl}/mix`, { method: 'POST', body: mixForm });
        if (!mixRes.ok) throw new Error("Audio mixing failed.");
        
        const finalBuffer = Buffer.from(await mixRes.arrayBuffer());
        return { audioUri: `data:audio/mpeg;base64,${finalBuffer.toString('base64')}` };
    }
);
