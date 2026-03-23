'use server';
/**
 * @fileOverview A flow for generating high-quality speech using Resemble.ai.
 * Provides high-fidelity voice synthesis via the Resemble.ai API.
 */
import { ai } from '@/ai/genkit';
import { TextToSpeechInputSchema, TextToSpeechOutputSchema, type TextToSpeechInput, type TextToSpeechOutput } from './text-to-speech-types';

export async function textToSpeechFlow(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
    try {
        return await textToSpeechGenkitFlow(input);
    } catch (error: any) {
        console.error("Resemble.ai TTS Flow Error:", error);
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
        
        // Mapping UI voices to Resemble Voice UUIDs
        // Note: These should be replaced with your actual Resemble Voice UUIDs
        const voiceMap: Record<string, string> = {
            clive: process.env.RESEMBLE_VOICE_CLIVE_ID || 'default_uuid',
            clara: process.env.RESEMBLE_VOICE_CLARA_ID || 'default_uuid',
            james: process.env.RESEMBLE_VOICE_JAMES_ID || 'default_uuid',
            alex: 'default_uuid',
            marcus: 'default_uuid',
            elena: 'default_uuid',
            maya: 'default_uuid',
            silas: 'default_uuid',
            victor: 'default_uuid',
            sophie: 'default_uuid',
            kai: 'default_uuid',
            male: process.env.RESEMBLE_VOICE_JAMES_ID || 'default_uuid',
            female: process.env.RESEMBLE_VOICE_CLARA_ID || 'default_uuid'
        };

        const voiceUuid = voiceMap[voice] || voiceMap['clive'];
        const apiKey = process.env.RESEMBLE_API_KEY;
        const projectUuid = process.env.RESEMBLE_PROJECT_ID;

        if (!apiKey || !projectUuid) {
            throw new Error('Resemble API Key or Project ID is missing in environment variables.');
        }

        // 1. Create the clip
        const url = `https://app.resemble.ai/api/v2/projects/${projectUuid}/clips`;
        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Token token=${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: `Sargam Clip ${Date.now()}`,
                body: text,
                voice_uuid: voiceUuid,
                is_public: false,
                is_archived: false
            }),
        };

        const response = await fetch(url, options);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Resemble API error: ${response.status}`);
        }

        const result = await response.json();
        const clipUrl = result.item?.link;

        if (!clipUrl) {
            throw new Error('Resemble AI did not return a clip URL.');
        }

        // 2. Fetch the actual audio file and convert to Base64
        const audioResponse = await fetch(clipUrl);
        if (!audioResponse.ok) {
            throw new Error('Failed to download the generated audio clip.');
        }

        const arrayBuffer = await audioResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Audio = buffer.toString('base64');

        return {
            media: `data:audio/mpeg;base64,${base64Audio}`,
        };
    }
);
