'use server';
/**
 * @fileOverview Neural Voice Cloning and Transformation Flow.
 * Handles voice sample analysis, cloning, and direct Speech-to-Speech swaps via ElevenLabs.
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
    type VocalReplacementOutput 
} from './voice-cloning-types';

export type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

/**
 * Analyzes a vocal sample to suggest optimal ElevenLabs settings.
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
 * Adds a new voice to ElevenLabs library.
 */
export async function cloneVoice(input: VoiceCloningInput): Promise<ActionResult<VoiceCloningOutput>> {
    try {
        const { name, samples } = input;
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) throw new Error("ElevenLabs API key is missing.");

        // Analyze the first sample for metadata
        const analysisResponse = await analyzeVoicePrompt({ sampleDataUri: samples[0] });
        const analysis = analysisResponse.output!;

        const finalDescription = analysis.description.length > 480 
            ? analysis.description.substring(0, 477) + "..." 
            : analysis.description;

        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', finalDescription);

        samples.forEach((uri, i) => {
            const buffer = Buffer.from(uri.split(',')[1], 'base64');
            formData.append('files', new Blob([buffer], { type: 'audio/wav' }), `sample_${i}.wav`);
        });

        const res = await fetch('https://api.elevenlabs.io/v1/voices/add', {
            method: 'POST', 
            headers: { 'xi-api-key': apiKey }, 
            body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail?.message || "Cloning failed.");

        return { 
            success: true,
            data: {
                voiceId: data.voice_id,
                description: finalDescription,
                suggestedSettings: {
                    stability: analysis.suggestedStability,
                    similarity_boost: analysis.suggestedSimilarity
                }
            }
        };
    } catch (e: any) {
        return { success: false, error: e.message || "Cloning failed." };
    }
}

/**
 * Synthesizes text using a cloned voice.
 */
export async function speakWithClone(input: CloneSpeechInput): Promise<ActionResult<CloneSpeechOutput>> {
    try {
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
        return { 
            success: true, 
            data: { audioUri: `data:audio/mpeg;base64,${buffer.toString('base64')}` } 
        };
    } catch (e: any) {
        return { success: false, error: e.message || "Synthesis failed." };
    }
}

/**
 * Performs a direct Voice Swap using ElevenLabs Speech-to-Speech (STS).
 */
export async function replaceVocals(input: VocalReplacementInput): Promise<ActionResult<VocalReplacementOutput>> {
    try {
        const { audioDataUri, voiceId } = input;
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) throw new Error("ElevenLabs API key is missing.");

        const formData = new FormData();
        const buffer = Buffer.from(audioDataUri.split(',')[1], 'base64');
        const mime = audioDataUri.split(';')[0].split(':')[1] || 'audio/wav';
        
        // Append input audio
        formData.append('audio', new Blob([buffer], { type: mime }), 'input.wav');
        formData.append('model_id', 'eleven_multilingual_sts_v2');
        formData.append('voice_settings', JSON.stringify({
            stability: 0.4,
            similarity_boost: 0.8,
            style: 0.0,
            use_speaker_boost: true
        }));

        const response = await fetch(`https://api.elevenlabs.io/v1/speech-to-speech/${voiceId}`, {
            method: 'POST',
            headers: { 'xi-api-key': apiKey },
            body: formData
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(`Neural Engine Transformation failed: ${err.detail?.message || response.statusText}`);
        }

        const resBuffer = Buffer.from(await response.arrayBuffer());
        return { 
            success: true, 
            data: { audioUri: `data:audio/mpeg;base64,${resBuffer.toString('base64')}` } 
        };
    } catch (e: any) {
        console.error("Replacement Error:", e);
        return { success: false, error: e.message || "Replacement failed." };
    }
}
