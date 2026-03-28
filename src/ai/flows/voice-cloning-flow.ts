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

/**
 * AI Director for "Singer Filter" logic.
 * Analyzes the source performance to optimize neural conversion.
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
      expressionLevel: z.string().describe('Description of the singing style (e.g., "emotional ballad", "high energy pop").')
    })
  },
  prompt: `You are the SKV AI Musical Director. Analyze this isolated vocal track.
  Determine the emotional intensity and pitch range. 
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

/**
 * Polling logic to wait for the neural engine to finish warming up.
 * Standardized on 127.0.0.1:1000 for studio internal communication.
 */
async function waitForBackend() {
  const healthUrl = "http://127.0.0.1:1000/health";
  while (true) {
    try {
      const res = await fetch(healthUrl, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.ready) break;
      }
    } catch (e) {
      // Server might not be up at all yet, continue polling
    }
    await new Promise(r => setTimeout(r, 3000));
  }
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

    // Analyze sample for description
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
        const mimeType = dataUri.split(';')[0].split(':')[1] || 'audio/mpeg';
        const base64Data = dataUri.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        let extension = 'mp3';
        if (mimeType.includes('webm')) extension = 'webm';
        else if (mimeType.includes('wav')) extension = 'wav';
        else if (mimeType.includes('ogg')) extension = 'ogg';

        const blob = new Blob([buffer], { type: mimeType });
        formData.append('files', blob, `sample_${i}.${extension}`);
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: formData,
    });

    console.log("Status:", response.status);
    console.log("Headers:", response.headers);

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Non-JSON response from ElevenLabs voices/add:", text);
      throw new Error("Voice synthesis service returned an invalid response.");
    }

    if (!response.ok) {
      throw new Error(data.detail?.message || "Cloning failed. Ensure audio is clear and long enough.");
    }

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

        console.log("Status:", response.status);
        console.log("Headers:", response.headers);

        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                console.error("Non-JSON error from ElevenLabs TTS:", errorText);
                throw new Error(`TTS failed with status ${response.status}.`);
            }
            throw new Error(errorData.detail?.message || `TTS failed with status ${response.status}.`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
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
        const engineUrl = 'http://127.0.0.1:1000';

        // 0. WAIT FOR NEURAL WARM-UP
        await waitForBackend();

        // 1. SEPARATE (Vocals vs BGM)
        const separateFormData = new FormData();
        const base64Content = audioDataUri.split(',')[1];
        if (!base64Content) throw new Error("Invalid audio data format.");
        
        const inputBlob = new Blob([Buffer.from(base64Content, 'base64')], { type: 'audio/wav' });
        separateFormData.append('audio', inputBlob, 'input.wav');

        let separateResponse;
        try {
            separateResponse = await fetch(`${engineUrl}/clone/separate`, {
                method: 'POST',
                body: separateFormData
            });
            console.log("Status (Separate):", separateResponse.status);
            console.log("Headers (Separate):", separateResponse.headers);
        } catch (err) {
            throw new Error(`Voice Engine is unreachable at ${engineUrl}. Ensure main.py is running on port 1000.`);
        }

        const separateText = await separateResponse.text();
        let separateData;
        try {
            separateData = JSON.parse(separateText);
        } catch (e) {
            console.error("Non-JSON response from separation engine:", separateText);
            throw new Error("Neural separation engine returned an invalid response.");
        }

        if (!separateResponse.ok) {
            throw new Error(separateData?.error || "Neural engine is warming up. Please try again in a few seconds.");
        }
        
        const { vocals, bgm } = separateData;
        if (!vocals || !bgm) throw new Error("The neural engine failed to isolate the vocal track.");

        // 2. ANALYZE (Singer Filter Analysis)
        const directorAnalysis = await singerDirectorPrompt({ vocalDataUri: vocals });
        const analysis = directorAnalysis.output!;

        // 3. REPLACE (Neural Vocal Transformation)
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

        console.log("Status (STS):", stsResponse.status);
        console.log("Headers (STS):", stsResponse.headers);

        if (!stsResponse.ok) {
            const errorText = await stsResponse.text();
            let stsError;
            try {
                stsError = JSON.parse(errorText);
            } catch (e) {
                console.error("Non-JSON error from ElevenLabs STS:", errorText);
                throw new Error(`Vocal synthesis failed during neural transformation stage.`);
            }
            throw new Error(stsError.detail?.message || `Vocal synthesis failed during neural transformation stage.`);
        }

        const aiVocalBuffer = Buffer.from(await stsResponse.arrayBuffer());
        const aiVocalBlob = new Blob([aiVocalBuffer], { type: 'audio/mpeg' });

        // 4. MIX (AI Vocals + Original BGM)
        const mixFormData = new FormData();
        mixFormData.append('vocals', aiVocalBlob, 'ai_vocals.mp3');
        const bgmBlob = new Blob([Buffer.from(bgm.split(',')[1], 'base64')], { type: 'audio/wav' });
        mixFormData.append('bgm', bgmBlob, 'original_bgm.wav');

        let mixResponse;
        try {
            mixResponse = await fetch(`${engineUrl}/mix`, {
                method: 'POST',
                body: mixFormData
            });
            console.log("Status (Mix):", mixResponse.status);
            console.log("Headers (Mix):", mixResponse.headers);
        } catch (err) {
            throw new Error("Failed to connect to Voice Engine for final mastering stage.");
        }

        if (!mixResponse.ok) {
            const mixText = await mixResponse.text();
            let mixError;
            try {
                mixError = JSON.parse(mixText);
            } catch (e) {
                console.error("Non-JSON response from mixing engine:", mixText);
                throw new Error("Mastering engine returned an invalid response.");
            }
            throw new Error(mixError.error || "Mastering stage failed.");
        }

        const finalBuffer = Buffer.from(await mixResponse.arrayBuffer());
        return { audioUri: `data:audio/mpeg;base64,${finalBuffer.toString('base64')}` };
    }
);
