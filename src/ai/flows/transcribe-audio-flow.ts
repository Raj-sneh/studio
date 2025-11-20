'use server';
/**
 * @fileOverview This file defines the Genkit flow for transcribing audio into a sequence of musical notes.
 *
 * @interface TranscribeAudioInput - Defines the input schema for the transcribeAudio function.
 * @interface TranscribeAudioOutput - Defines the output schema for the transcribeAudio function.
 * @function transcribeAudio - The main exported function that triggers the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Instrument } from '@/types';

const TranscribeAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "A recording of music, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  instrument: z.enum(['piano', 'guitar', 'drums', 'violin', 'xylophone', 'flute', 'saxophone']).describe('The instrument the user claims they are playing.'),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;


const TranscribeAudioOutputSchema = z.object({
  notes: z.array(z.object({
    key: z.string().describe("The musical note name (e.g., 'C4', 'F#5')."),
    duration: z.string().describe("The duration of the note (e.g., '4n', '8n')."),
    time: z.number().describe('The start time of the note in seconds.'),
  })).describe('An array of transcribed notes.'),
  instrument: z.enum(['piano', 'guitar', 'drums', 'violin', 'xylophone', 'flute', 'saxophone']).describe('The instrument identified in the audio.'),
});
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;


export async function transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
  return transcribeAudioFlow(input);
}


const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async (input) => {
    const llmResponse = await ai.generate({
      prompt: `You are an expert music transcriber and instrument identifier with perfect pitch.
    Your task is to listen to an audio recording and perform two actions:
    1. Identify the primary instrument being played. The user suggests it is a {{{instrument}}}, but you should rely on your own analysis of the audio.
    2. Transcribe the audio into a sequence of musical notes.

    The output should be a JSON object containing the identified instrument and an array of note objects, where each object includes the note's key, duration, and start time.

    Analyze the following audio: {{media url=audioDataUri}}`,
      output: { schema: TranscribeAudioOutputSchema },
    });

    return llmResponse.output || { notes: [], instrument: 'piano' };
  }
);
