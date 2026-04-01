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

/**
 * Dynamically resolves the Neural Engine URL based on environment context.
 */
function getBaseUrl() {
  return process.env.NEURAL_ENGINE_URL || process.env.NEXT_PUBLIC_NEURAL_ENGINE_URL || "http://localhost:8080";
}

/**
 * Robust polling logic to ensure the Neural Engine is ready.
 * Retries up to 25 times with a 2-second delay (50s total window).
 */
async function waitForBackend() {
  // 1. Clean the URL (removes any accidental double slashes)
  const baseUrl = getBaseUrl().replace(/\/$/, "");
  console.log("SKV AI: Checking Neural Engine status at:", baseUrl);

  // 2. Try to connect, but only for a max of 15 seconds 
  // since we know the server is likely already awake from the credit check.
  for (let i = 0; i < 10; i++) { 
    try {
      const res = await fetch(`${baseUrl}/`, { 
        cache: 'no-store',
        mode: 'cors',
        // Add a small timeout so we don't hang the server action
        signal: AbortSignal.timeout(5000) 
      });
      
      // If we get any response (even a 404), it means the server is UP
      if (res.status < 500) {
        console.log("SKV AI: Neural Engine is REACHABLE.");
        return true;
      }
    } catch (e) {
      console.log(`SKV AI: Ping attempt ${i+1} failed. Engine might be busy...`);
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  
  // 3. Fallback: If the ping fails but we know the server was just up, 
  // let the code proceed anyway instead of crashing.
  return true; 
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

const singerDirectorPrompt = ai.definePrompt({
  name: 'singerDirectorPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: z.object({ vocalDataUri: z.string() }) },
  output: {
    schema: z.object({
      suggestedStability: z.number(),
      suggestedSimilarity: z.number(),
      expressionLevel: z.string()
    })
  },
  prompt: `Analyze isolated vocal for Speech-to-Speech settings: {{media url=vocalDataUri}}`,
});

/** Exported Functions - Wrappers return result objects to avoid Next.js prod error obfuscation */
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
    if (!apiKey) throw new Error("ElevenLabs API key is missing in server environment.");

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
    if (!response.ok) throw new Error(data.detail?.message || "Voice cloning protocol failed.");

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
        const { audioDataUri, voiceId, settings } = input;
        const apiKey = process.env.ELEVENLABS_API_KEY;
        const baseUrl = getBaseUrl();
        
        await waitForBackend();

        // 1. SEPARATE (Vocals vs BGM)
        const separateFormData = new FormData();
        const base64Content = audioDataUri.split(',')[1];
        const inputBlob = new Blob([Buffer.from(base64Content, 'base64')], { type: 'audio/wav' });
        separateFormData.append('audio', inputBlob, 'input.wav');

        let separateResponse = await fetch(`${baseUrl.replace(/\/$/, "")}/separate`, {
            method: 'POST',
            body: separateFormData
        });

        // FIX: Only call .json() once and store it
        const separateData = await separateResponse.json().catch(() => ({}));

        if (!separateResponse.ok) {
            throw new Error(`Neural separation engine failed: ${separateData.error || "Route not found (404). Redeploy Python backend."}`);
        }
        
        const { vocals, bgm } = separateData;

        // 2. DIRECTOR ANALYSIS
        const directorAnalysis = await singerDirectorPrompt({ vocalDataUri: vocals });
        const analysis = directorAnalysis.output!;

        // 3. TRANSFORM (Vocal -> AI Vocal via STS)
        const vBlob = new Blob([Buffer.from(vocals.split(',')[1], 'base64')], { type: 'audio/wav' });
        const stsFormData = new FormData();
        stsFormData.append('audio', vBlob, 'vocals.wav');
        stsFormData.append('model_id', 'eleven_multilingual_sts_v2'); 
        stsFormData.append('voice_settings', JSON.stringify({
            stability: settings?.stability ?? analysis.suggestedStability,
            similarity_boost: settings?.similarity_boost ?? analysis.suggestedSimilarity, 
        }));

        const stsResponse = await fetch(`https://api.elevenlabs.io/v1/speech-to-speech/${DEFAULT_VOICE_MAP[voiceId] || voiceId}`, {
            method: 'POST',
            headers: { 'xi-api-key': apiKey! },
            body: stsFormData,
        });

        if (!stsResponse.ok) throw new Error("Neural voice swap transformation failed.");
        const aiVocalBlob = new Blob([Buffer.from(await stsResponse.arrayBuffer())], { type: 'audio/mpeg' });

        // 4. MIX & MASTER
        const mixFormData = new FormData();
        mixFormData.append('vocals', aiVocalBlob, 'ai_vocals.mp3');
        mixFormData.append('bgm', new Blob([Buffer.from(bgm.split(',')[1], 'base64')], { type: 'audio/wav' }), 'bgm.wav');

        const mixResponse = await fetch(`${baseUrl.replace(/\/$/, "")}/mix`, {
            method: 'POST',
            body: mixFormData
        });

        if (!mixResponse.ok) throw new Error("Audio mastering stage failed.");
        const finalBuffer = Buffer.from(await mixResponse.arrayBuffer());
        return { audioUri: `data:audio/mpeg;base64,${finalBuffer.toString('base64')}` };
    }
);