
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
  notes: z.array(NoteSchema).describe('An array of 8 to 16 musical note objects. If the user request is unclear, create a simple, pleasant melody.'),
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
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are an expert music composer. Your task is to generate a short melody of 8-16 notes based on the user's prompt.

The output must be a JSON object containing a 'notes' array. Each object in the array represents a musical note and must have three properties in Tone.js format:
- 'key': The musical note and octave (e.g., 'C4', 'F#5').
- 'duration': The length of the note (e.g., '4n' for a quarter note, '8n' for an eighth note).
- 'time': The start time of the note in 'bar:quarter:sixteenth' format (e.g., '0:2:0').

Analyze the user's prompt, which might describe a mood, style, or a famous song. Always do your best to create a melody that fits the request. If the prompt is vague or you don't recognize a song, create a simple, pleasant, and original melody.

User prompt: "{{prompt}}"`,
});

const generateMelodyFlow = ai.defineFlow(
  {
    name: 'generateMelodyFlow',
    inputSchema: GenerateMelodyInputSchema,
    outputSchema: GenerateMelodyOutputSchema,
  },
  async input => {
    try {
      const { output } = await generateMelodyPrompt(input);
      // The definePrompt with an output schema will handle parsing and validation.
      // If output exists and has notes, return it.
      if (output?.notes) {
        return output;
      }
      // As a fallback, return an empty array if notes are missing.
      return { notes: [] };
    } catch (error) {
      console.error("Error in generateMelodyFlow:", error);
      // In case of any error during generation, return an empty array to prevent crashes.
      return { notes: [] };
    }
  }
);
