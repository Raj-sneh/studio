'use server';
/**
 * @fileOverview A flow for generating high-quality speech using Google's Gemini TTS.
 * Provides high-fidelity vocal interaction for Sargam AI.
 */
import { ai } from '@/ai/genkit';
import { TextToSpeechInputSchema, TextToSpeechOutputSchema, type TextToSpeechInput, type TextToSpeechOutput } from './text-to-speech-types';
import wav from 'wav';

/**
 * Converts PCM data to a WAV data URI.
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

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

export async function textToSpeechFlow(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
    try {
        return await geminiTTSFlow(input);
    } catch (error: any) {
        console.error("Gemini TTS Flow Error:", error);
        throw new Error(`Voice generation failed: ${error.message || 'Unknown error'}`);
    }
}

const geminiTTSFlow = ai.defineFlow(
    {
        name: 'geminiTTSFlow',
        inputSchema: TextToSpeechInputSchema,
        outputSchema: TextToSpeechOutputSchema,
    },
    async (input) => {
        const { text, voice } = input;

        // Map UI names to Gemini TTS Voice Names
        // Options: 'Algenib', 'Puck', 'Charon', 'Fenrir', 'Achernar', 'Alnilam'
        const voiceMap: Record<string, string> = {
            'clara': 'Puck',
            'female': 'Puck',
            'clive': 'Algenib',
            'male': 'Algenib',
            'james': 'Charon',
            'alex': 'Fenrir',
            'marcus': 'Achernar',
            'silas': 'Alnilam'
        };

        const targetVoice = voiceMap[voice] || 'Algenib';

        // Use Google's Latest Neural TTS Model
        const { media } = await ai.generate({
            model: 'googleai/gemini-2.5-flash-preview-tts',
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { 
                            voiceName: targetVoice 
                        },
                    },
                },
            },
            prompt: text,
        });

        if (!media || !media.url) {
            throw new Error('Neural engine returned no audio.');
        }

        const audioBuffer = Buffer.from(
            media.url.substring(media.url.indexOf(',') + 1),
            'base64'
        );

        return {
            media: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
        };
    }
);
