'use server';

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

const generateMelodyPrompt = ai.definePrompt({
  name: 'generateMelodyPrompt',
  input: { schema: GenerateMelodyInputSchema },
  output: { schema: GenerateMelodyOutputSchema },
  prompt: `You are an expert composer. Your goal is to create a short melody of 8-16 notes based on the user's request.
  
  Analyze the user's prompt (which could be a famous song or a description) and create a melody. Return it as an array of Note objects.

  IMPORTANT: If you cannot recognize the song or fulfill the request, return an empty "notes" array.
      
  User prompt: "{{prompt}}"`,
});

const generateMelodyFlow = ai.defineFlow(
  {
    name: 'generateMelodyFlow',
    inputSchema: GenerateMelodyInputSchema,
    outputSchema: GenerateMelodyOutputSchema,
    requireAppCheck: true,
  },
  async input => {
    try {
      const { output } = await generateMelodyPrompt(input);

      if (output) {
        const validation = GenerateMelodyOutputSchema.safeParse(output);
        if (validation.success) {
          return validation.data;
        }
        console.error("Melody generation returned invalid data:", validation.error);
      }
      return { notes: [] };

    } catch (error) {
      console.error("Error during AI generation in generateMelodyFlow:", error);
      return { notes: [] };
    }
  }
);
