
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

const TranscribeAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "A recording of music, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  instrument: z.enum(['piano']).describe('The instrument the user claims they are playing.'),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;


const TranscribeAudioOutputSchema = z.object({
  notes: z.array(z.object({
    key: z.string().describe("The musical note name (e.g., 'C4', 'F#5')."),
    duration: z.string().describe("The duration of the note in Tone.js notation (e.g., '4n' for a quarter note, '8n' for an eighth note)."),
    time: z.number().describe('The start time of the note in seconds from the beginning of the audio.'),
  })).describe('An array of transcribed notes, ordered by their start time.'),
  instrument: z.enum(['piano']).describe('The instrument identified in the audio. You must choose one from the list.'),
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
    Your task is to listen to an audio recording and perform two actions with high accuracy:
    1. Identify the primary instrument being played. The user suggests it is a '{{{instrument}}}', but you must rely on your own analysis of the audio to make the final determination from the available options.
    2. Transcribe the audio into a precise sequence of musical notes.

    The output must be a valid JSON object matching the provided schema.
    The 'notes' array should contain note objects, each with:
    - 'key': The scientific pitch notation (e.g., 'C4').
    - 'duration': The note's length in Tone.js format (e.g., '4n', '8t', '1m').
    - 'time': The exact start time of the note in seconds.
    
    The notes must be ordered chronologically by their 'time'.

    Analyze the following audio: {{media url=audioDataUri}}`,
      output: { schema: TranscribeAudioOutputSchema },
       config: {
        temperature: 0.1, // Lower temperature for more deterministic, less "creative" transcription
      }
    });

    return llmResponse.output || { notes: [], instrument: 'piano' };
  }
);
