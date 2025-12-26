
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

const GenerateMelodyInputSchema = z.object({
  prompt: z.string().describe('A text description of the melody to generate. e.g., "a happy, upbeat tune" or "play the theme from titanic"'),
});
export type GenerateMelodyInput = z.infer<typeof GenerateMelodyInputSchema>;

const GenerateMelodyOutputSchema = z.object({
  notes: z.array(
    z.object({
      key: z.string().describe("A musical note in scientific pitch notation, e.g., 'C4', 'F#5'."),
      duration: z.string().describe("The duration of the note in Tone.js notation, e.g., '4n' for a quarter note, '8n' for an eighth note."),
      time: z.number().describe('The time in seconds from the start of the sequence when the note should be played.'),
    })
  ).describe('An array of 8 to 16 musical notes that form the generated melody. If you cannot fulfill the request, return an empty array.'),
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
  prompt: `You are an expert composer who ONLY responds in the requested JSON format.

  **CRITICAL INSTRUCTIONS:**
  1.  **JSON ONLY:** Your entire response MUST be the JSON object defined in the output schema. Do not include any other text, markdown, or commentary.
  2.  **MELODY GENERATION:** Create a melody based on the user's prompt.
      - If the user asks for a known song, generate an accurate and recognizable main melody.
      - If the user describes a mood, create a short, original melody that fits the description.
  3.  **LENGTH:** The melody MUST be between 8 and 16 notes long.
  4.  **FAILURE CASE:** If you cannot recognize the song or fulfill the request for any reason, you MUST return a JSON object with an empty "notes" array: \`{"notes": []}\`. Do not explain why.

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
    // If the model output is somehow null or undefined, return an empty array to prevent crashes.
    if (!output) {
      return { notes: [] };
    }
    return output;
  }
);
