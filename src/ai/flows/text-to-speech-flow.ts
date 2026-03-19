'use server';
/**
 * @fileOverview A flow for generating speech/singing using Gemini 1.5 Flash.
 * Handles mapping UI voices to Gemini models and converting raw PCM to WAV.
 */
import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { TextToSpeechInputSchema, TextToSpeechOutputSchema, type TextToSpeechInput, type TextToSpeechOutput } from './text-to-speech-types';
import wav from 'wav';

/**
 * Converts raw PCM audio data into a WAV format data URI.
 * Gemini TTS returns 16-bit, Mono, 24kHz Linear PCM.
 */
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: Buffer[] = [];
    writer.on('error', (err) => {
      console.error("WAV Writer Error:", err);
      reject(err);
    });
    writer.on('data', (d) => {
      bufs.push(d);
    });
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

export async function textToSpeechFlow(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
    try {
        return await textToSpeechGenkitFlow(input);
    } catch (error: any) {
        console.error("TTS Flow Execution Error:", error);
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
        const { text, voice, sing } = input;
        
        // Mapping to confirmed supported voice names for Gemini TTS.
        const voiceMap: Record<string, string> = {
            clara: 'Algenib',    // Soft/Female
            james: 'Achernar',   // Deep/Male
            alex: 'Achird',      // Neutral/Male
            marcus: 'Algieba',   // Warm/Male
            elena: 'Aoede',      // Bright/Female
            maya: 'Autonoe',     // Crisp/Female
            silas: 'Charon',     // Mellow/Male
            victor: 'Enceladus', // Bold/Male
            sophie: 'Erinome',   // Gentle/Female
            kai: 'Fenrir',       // Cool/Male
            male: 'Achernar',
            female: 'Algenib',
            combined: 'Achernar',
            duet: 'Algenib'
        };

        const voiceName = voiceMap[voice] || 'Algenib';

        const { media } = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName },
                    },
                },
            },
            prompt: sing ? `Sing this text with a clear musical melody and professional rhythm. Ensure every word is sung beautifully: ${text}` : text,
        });

        if (!media || !media.url) {
            throw new Error('The AI artist was unable to perform right now.');
        }

        const base64Data = media.url.substring(media.url.indexOf(',') + 1);
        const audioBuffer = Buffer.from(base64Data, 'base64');

        const wavBase64 = await toWav(audioBuffer);

        return {
            media: 'data:audio/wav;base64,' + wavBase64,
        };
    }
);
