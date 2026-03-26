'use server';
/**
 * @fileOverview A flow for generating high-quality speech using ElevenLabs.
 * Provides high-fidelity voice synthesis via the ElevenLabs API, replacing legacy providers.
 */
import { ai } from '@/ai/genkit';
import { TextToSpeechInputSchema, TextToSpeechOutputSchema, type TextToSpeechInput, type TextToSpeechOutput } from './text-to-speech-types';

/**
 * Mapping of friendly UI names to real ElevenLabs Studio Voice IDs.
 */
const VOICE_MAP: Record<string, string> = {
  clive: 'JBFqnCBsd6RMkjVDRZzb', // George
  clara: '21m00Tcm4TlvDq8ikWAM', // Rachel
  james: 'ErXwUjzD4qc0CPByOn9G', // Antoni
  alex: 'Lcf7eeY9feMlh8o4NoOf', // Charlie
  marcus: 'FGY26y434K1pI7YJ0Isc', // Liam
  silas: 'onw03Z3tId3YtTjkIovC', // Daniel
  elena: 'EXAVITQu4vr4xnSDxMaL', // Bella
  maya: 'ThT5KcBe7VKqW9tB56Ww', // Dorothy
  victor: 'N2lVS0pAb7tWpHo7A9Gv', // Josh
  sophie: 'Xb7hH9S7yYf7Jb1JpG6p', // Alice
  kai: 'iP95p4v4P7i6I9S7yYf7', // Ethan
  male: 'ErXwUjzD4qc0CPByOn9G',
  female: '21m00Tcm4TlvDq8ikWAM'
};

export async function textToSpeechFlow(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
    try {
        return await elevenLabsTTSGenkitFlow(input);
    } catch (error: any) {
        console.error("ElevenLabs TTS Flow Error:", error);
        throw new Error(`Voice generation failed: ${error.message || 'Unknown error'}`);
    }
}

const elevenLabsTTSGenkitFlow = ai.defineFlow(
    {
        name: 'elevenLabsTTSGenkitFlow',
        inputSchema: TextToSpeechInputSchema,
        outputSchema: TextToSpeechOutputSchema,
    },
    async (input) => {
        const { text, voice, rate, language } = input;
        const apiKey = process.env.ELEVENLABS_API_KEY;

        if (!apiKey) {
            throw new Error('ElevenLabs API Key is missing in your .env file.');
        }

        const voiceId = VOICE_MAP[voice] || VOICE_MAP['clive'];
        
        // 1. Optimize text for natural performance using Gemini (The Director)
        // We use a simple prompt to add natural pauses based on the language
        const { text: optimizedText } = await ai.generate({
            model: 'googleai/gemini-2.5-flash',
            prompt: `You are a voice director. Add natural punctuation (dashes, ellipsis) to this text to make it sound human and expressive when spoken in ${language || 'English'}. Keep the meaning identical.\n\nText: ${text}`,
        });

        const finalOutputText = optimizedText || text;

        // 2. Synthesis via ElevenLabs
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
        const options = {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: finalOutputText,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                    style: 0.0,
                    use_speaker_boost: true
                }
            }),
        };

        const response = await fetch(url, options);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail?.message || `ElevenLabs API error: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Audio = buffer.toString('base64');

        return {
            media: `data:audio/mpeg;base64,${base64Audio}`,
        };
    }
);
