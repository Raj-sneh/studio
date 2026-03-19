'use server';
/**
 * @fileOverview A friendly music teacher who writes down piano tunes using Gemini 1.5 Flash.
 */
import {ai} from '@/ai/genkit';
import {
  GenerateNotesInputSchema,
  GenerateNotesOutputSchema,
  type GenerateNotesInput,
  type GenerateNotesOutput,
} from './generate-notes-types';

export async function generateNotes(input: GenerateNotesInput): Promise<GenerateNotesOutput> {
  try {
    return await generateNotesFlow(input);
  } catch (error: any) {
    console.error("Error in generateNotes flow:", error);
    throw new Error(`I had trouble writing the tune: ${error.message || 'Please try again.'}`);
  }
}

const prompt = ai.definePrompt({
  name: 'generateNotesPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {schema: GenerateNotesInputSchema},
  output: {schema: GenerateNotesOutputSchema},
  prompt: `You are a helpful music teacher. Your goal is to write down a piano tune that matches the user's request as accurately as possible.

**RULES:**
1. If it's a famous old song, give the exact notes.
2. If it's a modern song, don't copy it exactly. Write a unique tune that captures the vibe and style perfectly.
3. Speed (BPM) should be between 60-180.
4. Use valid Tone.js timing ("0:0:0") and durations ("4n", "8n").

{{#if feedback}}
The user said: "{{feedback.comment}}". Please fix this in the new version.
{{/if}}

User's request: "{{text}}"

Return only the JSON object.`,
});

const generateNotesFlow = ai.defineFlow(
  {
    name: 'generateNotesFlow',
    inputSchema: GenerateNotesInputSchema,
    outputSchema: GenerateNotesOutputSchema,
  },
  async input => {
    const response = await prompt(input);
    const output = response.output;
    if (!output) throw new Error("I couldn't figure out the notes for that. Try something simpler?");
    return output;
  }
);
