
'use server';

/**
 * @fileOverview This file defines the Genkit flow for generating a melody based on a user prompt.
 *
 * The flow takes a text description of a desired melody, and returns a sequence of musical notes.
 *
 * @interface GenerateMelodyInput - Defines the input schema for the generateMelody function.
 * @interface GenerateMelodyOutput - Defines the output schema for the generateMelody function.
 * @function generateMelody - The main exported function that triggers the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type {Note} from '@/types';

const GenerateMelodyInputSchema = z.object({
  prompt: z.string().describe('A text description of the melody to generate. e.g., "a happy, upbeat tune"'),
});
export type GenerateMelodyInput = z.infer<typeof GenerateMelodyInputSchema>;

const GenerateMelodyOutputSchema = z.object({
  notes: z.array(
    z.object({
      key: z.string().describe('e.g., C4'),
      duration: z.string().describe("Tone.js duration, e.g., '8n', '4n'"),
      time: z.number().describe('Time in seconds from the start of the sequence.'),
    })
  ).describe('An array of generated notes that form a melody.'),
});
export type GenerateMelodyOutput = z.infer<typeof GenerateMelodyOutputSchema>;


export async function generateMelody(
  input: GenerateMelodyInput
): Promise<GenerateMelodyOutput> {
  return generateMelodyFlow(input);
}

const generateMelodyPrompt = ai.definePrompt({
  name: 'generateMelodyPrompt',
  input: {schema: GenerateMelodyInputSchema},
  output: {schema: GenerateMelodyOutputSchema},
  prompt: `You are an expert composer. Your task is to create a short, simple melody for the piano based on the user's prompt.

  - The melody should be between 8 and 16 notes long.
  - The output must be a JSON object containing an array of note objects.
  - Each note object must have 'key' (e.g., 'C4'), 'duration' (e.g., '8n', '4n'), and 'time' (in seconds from the start).
  - The melody should be musically coherent and reflect the user's prompt.
  - Be creative!

  User prompt: {{{prompt}}}
  `,
});

const generateMelodyFlow = ai.defineFlow(
  {
    name: 'generateMelodyFlow',
    inputSchema: GenerateMelodyInputSchema,
    outputSchema: GenerateMelodyOutputSchema,
  },
  async input => {
    const {output} = await generateMelodyPrompt(input);
    return output!;
  }
);
