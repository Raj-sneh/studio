
'use server';
/**
 * @fileOverview This file defines the Genkit flow for transcribing audio into a sequence of musical notes.
 *
 * This file contains a server action and should only export async functions.
 */
import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';
import type {Instrument, Note} from '@/types';

const TranscribeAudioInputSchema = z.object({
  audioDataUri: z.string().describe('The audio data URI to transcribe.'),
  instrument: z.enum(['piano']).describe('The instrument being played.'),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;

const TranscribeAudioOutputSchema = z.object({
  notes: z
    .array(
      z.object({
        key: z.string().describe('e.g., C4'),
        duration: z.string().describe("Tone.js duration, e.g., '8n', '4n'"),
        time: z
          .number()
          .describe('Time in seconds from the start of the sequence.'),
      })
    )
    .describe('An array of transcribed notes.'),
  instrument: z.enum(['piano']).describe('The identified instrument.'),
});
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;

export async function transcribeAudio(
  input: TranscribeAudioInput
): Promise<TranscribeAudioOutput> {
  return transcribeAudioFlow(input);
}

const transcribeAudioPrompt = ai.definePrompt({
  name: 'transcribeAudioPrompt',
  input: {schema: TranscribeAudioInputSchema},
  output: {schema: TranscribeAudioOutputSchema},

  prompt: `You are an expert music transcriber with perfect pitch.
    Your task is to listen to an audio recording and accurately transcribe the musical notes into a JSON object.

    - The output must be an array of note objects.
    - Each note object must have 'key' (e.g., 'C4'), 'duration' (e.g., '8n'), and 'time' (in seconds).
    - Be precise with the timing and pitch of each note.
    - If no clear musical notes are detected, return an empty array for "notes".

    Audio to transcribe: {{media url=audioDataUri}}
  `,
});

const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async (input) => {
    const {output} = await transcribeAudioPrompt(input, {
      model: googleAI.model('gemini-1.5-flash-latest'),
    });
    return output!;
  }
);
