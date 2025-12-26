
'use server';

/**
 * @fileOverview This file defines the Genkit flow for generating a melody based on a user prompt.
 *
 * This new version simplifies the AI's task significantly. The AI is now only responsible
 * for generating a comma-separated string of musical notes. The TypeScript code then
 * parses this string into the structured Note array required by the application.
 * This approach is more robust and less prone to AI formatting errors.
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
  notesString: z.string().describe('A comma-separated string of 8 to 16 musical notes in scientific pitch notation (e.g., "C4, G4, A4, G4"). If you cannot fulfill the request, you MUST return an empty string.'),
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
        2.  **NOTE STRING:** Create a melody based on the user's prompt and return it as a single, comma-separated string in the "notesString" field.
        3.  **FORMAT:** Use scientific pitch notation (e.g., C4, F#5, Ab3).
        4.  **LENGTH:** The melody MUST be between 8 and 16 notes long.
        5.  **FAILURE CASE:** If you cannot recognize the song or fulfill the request for any reason, you MUST return a JSON object with an empty "notesString": \`{"notesString": ""}\`. Do not explain why.
      
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
      
      // If validation fails, return the guaranteed safe default.
      console.error("Melody generation returned invalid data:", validation.error);
      return { notesString: '' };

    } catch (error) {
      console.error("Error during AI generation in generateMelodyFlow:", error);
      // If the AI generation itself throws an error, catch it and return a safe, empty response.
      return { notesString: '' };
    }
  }
);
