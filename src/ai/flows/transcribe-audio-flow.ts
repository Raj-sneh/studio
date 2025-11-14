'use server';
/**
 * @fileOverview This file defines the Genkit flow for transcribing audio into a sequence of musical notes.
 *
 * @interface TranscribeAudioInput - Defines the input schema for the transcribeAudio function.
 * @interface TranscribeAudioOutput - Defines the output schema for the transcribeAudio function.
 * @function transcribeAudio - The main exported function that triggers the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const NoteSchema = z.object({
  key: z.string().describe("The musical note name (e.g., 'C4', 'F#5')."),
  duration: z.string().describe("The duration of the note (e.g., '4n', '8n')."),
  time: z.number().describe('The start time of the note in seconds.'),
});
export type Note = z.infer<typeof NoteSchema>;

const TranscribeAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "A recording of music, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  instrument: z.enum(['piano', 'guitar', 'drums', 'violin']).describe('The instrument being played.'),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;


const TranscribeAudioOutputSchema = z.object({
  notes: z.array(NoteSchema).describe('An array of transcribed notes.'),
});
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;


export async function transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
  return transcribeAudioFlow(input);
}


const transcribeAudioPrompt = ai.definePrompt({
    name: 'transcribeAudioPrompt',
    input: { schema: TranscribeAudioInputSchema },
    output: { schema: TranscribeAudioOutputSchema },
    prompt: `You are an expert music transcriber with perfect pitch.
    Your task is to listen to an audio recording of a {{{instrument}}} and transcribe it into a sequence of musical notes.
    The output should be an array of note objects, where each object includes the note's key, duration, and start time.

    Analyze the following audio: {{media url=audioDataUri}}`,
});


const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async (input) => {
    const { output } = await transcribeAudioPrompt(input);
    return output!;
  }
);
