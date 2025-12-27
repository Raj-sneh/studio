
'use server';

/**
 * @fileOverview This file defines the Genkit flow for generating a melody based on a user prompt.
 *
 * The AI is responsible for generating a structured array of Note objects.
 * This approach provides a more reliable and structured output compared to parsing a string.
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

const NoteSchema = z.object({
  key: z.string().describe('e.g., C4'),
  duration: z.string().describe("Tone.js duration, e.g., '8n', '4n'"),
  time: z.string().describe("Tone.js time, e.g., '0:0:1'"),
});

const GenerateMelodyOutputSchema = z.object({
  notes: z.array(NoteSchema).describe('An array of 8 to 16 musical note objects. If you cannot fulfill the request, you MUST return an empty array.'),
});
export type GenerateMelodyOutput = z.infer<typeof GenerateMelodyOutputSchema>;


export async function generateMelody(
  input: GenerateMelodyInput
): Promise<GenerateMelodyOutput> {
  return generateMelodyFlow(input);
}

const generateMelodyFlow = ai.defineFlow(
  {
    name: 'generateMelodyFlow',
    inputSchema: GenerateMelodyInputSchema,
    outputSchema: GenerateMelodyOutputSchema,
  },
  async input => {
    try {
      const { output } = await ai.generate({
        prompt: `You are an expert composer who ONLY responds in the requested JSON format.

        **CRITICAL INSTRUCTIONS:**
        1.  **JSON ONLY:** Your entire response MUST be the JSON object defined in the output schema.
        2.  **NOTE ARRAY:** Create a melody based on the user's prompt and return it as an array of Note objects in the "notes" field.
        3.  **NOTE FORMAT:** Each note object must have 'key', 'duration', and 'time'. Use scientific pitch notation for 'key' (e.g., C4) and Tone.js format for 'duration' ('8n') and 'time' ('0:0:2').
        4.  **LENGTH:** The melody MUST be between 8 and 16 notes long.
        5.  **FAILURE CASE:** If you cannot recognize the song or fulfill the request for any reason, you MUST return a JSON object with an empty "notes" array: \`{"notes": []}\`. Do not explain why.
      
        User prompt: ${input.prompt}
        `,
        output: {
          schema: GenerateMelodyOutputSchema,
        },
      });

      // Final validation to ensure the output is safe.
      const validation = GenerateMelodyOutputSchema.safeParse(output);
      if (validation.success) {
        return validation.data;
      }
      
      console.error("Melody generation returned invalid data:", validation.error);
      return { notes: [] };

    } catch (error) {
      console.error("Error during AI generation in generateMelodyFlow:", error);
      return { notes: [] };
    }
  }
);
