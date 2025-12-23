
'use server';

/**
 * @fileOverview This file defines the Genkit flow for generating a melody based on a user prompt.
 *
 * The flow takes a text description of a desired melody, and returns a sequence of musical notes.
 * It can generate original melodies from moods or attempt to create a simplified version of a known song.
 *
 * @interface GenerateMelodyInput - Defines the input schema for the generateMelody function.
 * @interface GenerateMelodyOutput - Defines the output schema for the generateMelody function.
 * @function generateMelody - The main exported function that triggers the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type {Note} from '@/types';

const GenerateMelodyInputSchema = z.object({
  prompt: z.string().describe('A text description of the melody to generate. e.g., "a happy, upbeat tune" or "play the theme from titanic"'),
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
  prompt: `You are an expert composer and musician. Your task is to create a piano melody based on the user's prompt.

- The output must be a JSON object containing an array of note objects.
- Each note object must have 'key' (e.g., 'C4'), 'duration' (e.g., '8n', '4n'), and 'time' (in seconds from the start).

**Instructions:**

1.  **Check for a specific song request.** If the user asks for a known song (e.g., "play titanic theme", "kal ho naa ho", "twinkle twinkle"), generate a simplified but recognizable version of that song's main melody. The melody should last for approximately 30 seconds.
2.  **If it's not a specific song,** create an original melody based on the user's description (e.g., "a happy, upbeat tune"). This melody should be between 8 and 16 notes long.
3.  The melody should be musically coherent and reflect the user's prompt.
4.  Be creative!

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
