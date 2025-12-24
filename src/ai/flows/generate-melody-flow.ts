
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
import type {Note, Instrument} from '@/types';

const GenerateMelodyInputSchema = z.object({
  prompt: z.string().describe('A text description of the melody to generate. e.g., "a happy, upbeat tune" or "play the theme from titanic"'),
});
export type GenerateMelodyInput = z.infer<typeof GenerateMelodyInputSchema>;

const GenerateMelodyOutputSchema = z.object({
  instrument: z.enum(['piano', 'guitar', 'violin', 'flute', 'saxophone', 'xylophone', 'drums'])
    .describe("The best instrument to play this melody. For example, a rock song might be best on 'guitar', a classical piece on 'violin' or 'piano'."),
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
  prompt: `You are an expert composer and musician with perfect pitch. Your primary task is to create a melody based on the user's prompt.

- The output must be a JSON object containing an array of note objects and the most appropriate instrument.
- Each note object must have 'key' (e.g., 'C4'), 'duration' (e.g., '8n'), and 'time' (in seconds).

**CRITICAL INSTRUCTIONS:**

1.  **Prioritize Accuracy for Known Songs:** If the user asks for a specific, known song (e.g., "play titanic theme", "kal ho naa ho", "twinkle twinkle", or provides lyrics), your absolute priority is to generate a **highly accurate and recognizable** version of that song's main melody. Do not improvise or create a "similar" tune. Transcribe the core melody faithfully. The melody should last for approximately 20-30 seconds.
2.  **Choose the Best Instrument:** Based on the user's prompt, select the most suitable instrument.
    - **Default to Piano:** For most general requests (e.g., "a happy tune", "a sad song"), 'piano' is an excellent and safe choice.
    - **Contextual Choices:** Select other instruments only when they are a clear fit. For example:
        - 'Stairway to Heaven' should be 'guitar'.
        - 'My Heart Will Go On' could be 'flute' or 'violin'.
        - A simple nursery rhyme is a good fit for 'xylophone'.
    - **Avoid Overusing Xylophone:** Do not default to 'xylophone' for complex or general prompts. It is a specialized instrument.
3.  **Generate Original Melodies Otherwise:** If the prompt is a general description (e.g., "a happy, upbeat tune", "a sad, slow melody"), create a short, original melody that fits the description. This melody should be between 8 and 16 notes long.
4.  **Ensure Musical Coherence:** All melodies, whether transcribed or original, must be musically coherent and pleasing to the ear.

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
