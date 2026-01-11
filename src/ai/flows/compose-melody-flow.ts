
'use server';
/**
 * @fileOverview A flow for composing melodies using a generative AI model.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Note } from '@/types';

const ComposeMelodyInputSchema = z.string();

const NoteSchema = z.object({
  key: z.union([z.string(), z.array(z.string())]).describe("The musical note or chord, e.g., 'C4' or ['C4', 'E4', 'G4']."),
  duration: z.string().describe("The duration of the note in Tone.js notation, e.g., '4n', '8n', '2n'."),
  time: z.string().describe("The time of the note in Tone.js transport time format, e.g., '0:0:0' for the start."),
});

const ComposeMelodyOutputSchema = z.array(NoteSchema);

export async function composeMelodyFlow(
  prompt: z.infer<typeof ComposeMelodyInputSchema>
): Promise<z.infer<typeof ComposeMelodyOutputSchema>> {
  return composeMelodyGenkitFlow(prompt);
}

const composeMelodyPrompt = ai.definePrompt(
  {
    name: 'composeMelodyPrompt',
    input: { schema: ComposeMelodyInputSchema },
    output: { schema: ComposeMelodyOutputSchema },
    prompt: `You are a music composition assistant. Based on the user's prompt, create a simple melody of about 4 to 8 measures.

User Prompt: {{{prompt}}}

Generate a sequence of notes. Ensure the 'time' for each note is sequential and logical for a piece of music. The output should be a JSON array of note objects.
For the time, use the format 'Bar:Quarter:Sixteenth'. For example, '0:1:2' means Bar 0, 1st quarter note, 2nd sixteenth note.
A quarter note is '4n', an eighth note is '8n', a half note is '2n'.`,
  }
);


const composeMelodyGenkitFlow = ai.defineFlow(
  {
    name: 'composeMelodyGenkitFlow',
    inputSchema: ComposeMelodyInputSchema,
    outputSchema: ComposeMelodyOutputSchema,
  },
  async (prompt) => {
    const { output } = await composeMelodyPrompt(prompt);
    // The output is already validated against the Zod schema.
    return output || [];
  }
);
