'use server';
/**
 * @fileOverview A flow for generating high-quality speech using Inworld AI TTS.
 * This flow provides sub-second latency and superior voice quality.
 */
import { ai } from '@/ai/genkit';
import { TextToSpeechInputSchema, TextToSpeechOutputSchema, type TextToSpeechInput, type TextToSpeechOutput } from './text-to-speech-types';

export async function textToSpeechFlow(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
    try {
        return await textToSpeechGenkitFlow(input);
    } catch (error: any) {
        console.error("Inworld TTS Flow Error:", error);
        throw new Error(`Voice generation failed: ${error.message || 'Unknown error'}`);
    }
}

const textToSpeechGenkitFlow = ai.defineFlow(
    {
        name: 'textToSpeechGenkitFlow',
        inputSchema: TextToSpeechInputSchema,
        outputSchema: TextToSpeechOutputSchema,
    },
    async (input) => {
        const { text, voice } = input;
        
        // Mapping UI voices to Inworld Voice IDs
        const voiceMap: Record<string, string> = {
            clive: 'Clive',
            clara: 'Clara',
            james: 'James',
            alex: 'Alex',
            marcus: 'Marcus',
            elena: 'Elena',
            maya: 'Maya',
            silas: 'Silas',
            victor: 'Victor',
            sophie: 'Sophie',
            kai: 'Kai',
            male: 'James',
            female: 'Clara'
        };

        const voiceId = voiceMap[voice] || 'Clive';
        const authToken = process.env.INWORLD_AUTH_TOKEN;

        if (!authToken) {
            throw new Error('Inworld Auth Token is missing in environment variables.');
        }

        const url = 'https://api.inworld.ai/tts/v1/voice';
        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                voiceId: voiceId,
                modelId: "inworld-tts-1.5-max",
                timestampType: "WORD"
            }),
        };

        const response = await fetch(url, options);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Inworld API error: ${response.status}`);
        }

        const result = await response.json();
        const audioContent = result.audioContent;

        if (!audioContent) {
            throw new Error('Inworld AI did not return any audio content.');
        }

        return {
            media: `data:audio/mpeg;base64,${audioContent}`,
        };
    }
);
