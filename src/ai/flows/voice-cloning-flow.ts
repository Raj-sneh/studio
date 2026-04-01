'use server';
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
    type VocalReplacementOutput 
} from './voice-cloning-types';

const getBaseUrl = () => process.env.NEURAL_ENGINE_URL || process.env.NEXT_PUBLIC_NEURAL_ENGINE_URL || "http://localhost:8080";

async function waitForBackend() {
    const url = getBaseUrl().replace(/\/$/, "");
    for (let i = 0; i < 25; i++) {
        try {
            const res = await fetch(`${url}/api/status`, { cache: 'no-store' });
            if (res.ok) return true;
        } catch (e) {}
        await new Promise(r => setTimeout(r, 2000));
    }
    throw new Error("Neural Engine timeout. Try again.");
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
 * Result wrapper for Server Actions to prevent obfuscation in production.
 */
type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function cloneVoice(input: VoiceCloningInput): Promise<ActionResult<VoiceCloningOutput>> {
    try {
        const result = await voiceCloningFlow(input);
        return { success: true, data: result };
    } catch (e: any) {
        return { success: false, error: e.message || "Cloning failed." };
    }
}

export async function speakWithClone(input: CloneSpeechInput): Promise<ActionResult<CloneSpeechOutput>> {
    try {
        const result = await speakWithCloneFlow(input);
        return { success: true, data: result };
    } catch (e: any) {
        return { success: false, error: e.message || "Synthesis failed." };
    }
}

export async function replaceVocals(input: VocalReplacementInput): Promise<ActionResult<VocalReplacementOutput>> {
    try {
        const result = await vocalReplacementFlow(input);
        return { success: true, data: result };
    } catch (e: any) {
        return { success: false, error: e.message || "Replacement failed." };
    }
}

export const voiceCloningFlow = ai.defineFlow(
    { 
        name: 'voiceCloningFlow', 
        inputSchema: VoiceCloningInputSchema, 
        outputSchema: VoiceCloningOutputSchema 
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

        samples.forEach((uri, i) => {
            const mime = uri.split(';')[0].split(':')[1] || 'audio/mpeg';
            const ext = mime.includes('webm') ? 'webm' : mime.includes('ogg') ? 'ogg' : 'wav';
            const buffer = Buffer.from(uri.split(',')[1], 'base64');
            formData.append('files', new Blob([buffer], { type: mime }), `sample_${i}.${ext}`);
        });

        const res = await fetch('https://api.elevenlabs.io/v1/voices/add', {
            method: 'POST', 
            headers: { 'xi-api-key': apiKey }, 
            body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail?.message || "Cloning failed.");

        return { 
            voiceId: data.voice_id,
            description: finalDescription,
            suggestedSettings: {
                stability: analysis.suggestedStability,
                similarity_boost: analysis.suggestedSimilarity
            }
        };
    }
);

export const vocalReplacementFlow = ai.defineFlow(
    { 
        name: 'vocalReplacementFlow', 
        inputSchema: VocalReplacementInputSchema, 
        outputSchema: VocalReplacementOutputSchema 
    },
    async (input) => {
        const { audioDataUri, voiceId } = input;
        const apiKey = process.env.ELEVENLABS_API_KEY;
        const baseUrl = getBaseUrl().replace(/\/$/, "");
        
        await waitForBackend();

        // 1. SEPARATE (Vocals vs BGM)
        const separateFormData = new FormData();
        const base64Content = audioDataUri.split(',')[1];
        const inputBlob = new Blob([Buffer.from(base64Content, 'base64')], { type: 'audio/wav' });
        separateFormData.append('audio', inputBlob, 'input.wav');

        let separateResponse = await fetch(`${baseUrl}/separate`, {
            method: 'POST',
            body: separateFormData
        });

        const separateData = await separateResponse.json().catch(() => ({}));
        if (!separateResponse.ok) {
            throw new Error(`Neural separation engine failed: ${separateData.error || separateResponse.statusText}`);
        }
        
        const { vocals, bgm } = separateData;

        // 2. TRANSFORM (Speech-to-Speech)
        const stsForm = new FormData();
        stsForm.append('audio', new Blob([Buffer.from(vocals.split(',')[1], 'base64')], { type: 'audio/wav' }), 'v.wav');
        stsForm.append('model_id', 'eleven_multilingual_sts_v2');
        stsForm.append('voice_settings', JSON.stringify({ stability: 0.35, similarity_boost: 0.85 }));
        
        const stsRes = await fetch(`https://api.elevenlabs.io/v1/speech-to-speech/${voiceId}`, {
            method: 'POST', 
            headers: { 'xi-api-key': apiKey! }, 
            body: stsForm
        });
        
        if (!stsRes.ok) {
            const stsErr = await stsRes.json().catch(() => ({}));
            throw new Error(`Neural transformation failed: ${stsErr.detail?.message || stsRes.statusText}`);
        }
        
        const aiVocalBlob = new Blob([Buffer.from(await stsRes.arrayBuffer())], { type: 'audio/mpeg' });

        // 3. MIX (AI Vocals + Original BGM)
        const mixForm = new FormData();
        mixForm.append('vocals', aiVocalBlob, 'v.mp3');
        mixForm.append('bgm', new Blob([Buffer.from(bgm.split(',')[1], 'base64')], { type: 'audio/wav' }), 'b.wav');
        
        const mixRes = await fetch(`${baseUrl}/mix`, { method: 'POST', body: mixForm });
        if (!mixRes.ok) {
            const mixErr = await mixRes.json().catch(() => ({}));
            throw new Error(`Audio mixing failed: ${mixErr.error || mixRes.statusText}`);
        }
        const mixData = await mixRes.arrayBuffer();
        
        const finalBuffer = Buffer.from(mixData);
        
        return { audioUri: `data:audio/mpeg;base64,${finalBuffer.toString('base64')}` };
    }
);

export const speakWithCloneFlow = ai.defineFlow(
    {
        name: 'speakWithCloneFlow',
        inputSchema: CloneSpeechInputSchema,
        outputSchema: CloneSpeechOutputSchema,
    },
    async (input) => {
        const { text, voiceId } = input;
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) throw new Error("ElevenLabs API key is missing.");

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: { stability: 0.5, similarity_boost: 0.75 }
            }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(`Synthesis failed: ${err.detail?.message || response.statusText}`);
        }
        
        const buffer = Buffer.from(await response.arrayBuffer());
        return { audioUri: `data:audio/mpeg;base64,${buffer.toString('base64')}` };
    }
);