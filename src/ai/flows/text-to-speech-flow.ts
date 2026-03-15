
'use server';
/**
 * @fileOverview A flow for generating speech/singing using Gemini 2.5 Flash Preview TTS.
 * Handles mapping UI voices to Gemini models and converting raw PCM to WAV.
 */
import 'server-only';
import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { TextToSpeechInputSchema, TextToSpeechOutputSchema, type TextToSpeechInput, type TextToSpeechOutput } from './text-to-speech-types';
import wav from 'wav';

/**
 * Converts raw PCM audio data into a WAV format data URI.
 * Gemini 2.5 Flash Preview TTS returns 16-bit, Mono, 24kHz Linear PCM.
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
        
        // Detailed mapping of Sargam artists to Gemini TTS characters
        const voiceMap: Record<string, string> = {
            clara: 'Algenib',    // Soft/Female
            james: 'Achernar',   // Deep/Male
            alex: 'Aldebaran',   // Neutral/Male
            marcus: 'Altair',    // Warm/Male
            elena: 'Arcturus',   // Bright/Female
            maya: 'Castor',      // Crisp/Female
            silas: 'Deneb',      // Mellow/Male
            victor: 'Pollux',    // Bold/Male
            sophie: 'Regulus',   // Gentle/Female
            kai: 'Sirius',       // Cool/Male
            male: 'Achernar',
            female: 'Algenib',
            combined: 'Achernar',
            duet: 'Algenib'
        };

        const voiceName = voiceMap[voice] || 'Algenib';

        const { media } = await ai.generate({
            model: googleAI.model('gemini-2.5-flash-preview-tts'),
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName },
                    },
                },
            },
            prompt: sing ? `Sing this text with a clear musical melody and professional rhythm. Ensure every word is sung: ${text}` : text,
        });

        if (!media || !media.url) {
            throw new Error('The AI artist was unable to perform right now.');
        }

        // Extract base64 and convert PCM to WAV
        const base64Data = media.url.substring(media.url.indexOf(',') + 1);
        const audioBuffer = Buffer.from(base64Data, 'base64');

        const wavBase64 = await toWav(audioBuffer);

        return {
            media: 'data:audio/wav;base64,' + wavBase64,
        };
    }
);
