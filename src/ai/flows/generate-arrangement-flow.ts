'use server';
/**
 * @fileOverview A helpful music maker that writes background tracks using Gemini 1.5 Flash.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateArrangementInputSchema,
  GenerateArrangementOutputSchema,
  type GenerateArrangementInput,
  type GenerateArrangementOutput,
} from './generate-arrangement-types';

export async function generateArrangement(input: GenerateArrangementInput): Promise<GenerateArrangementOutput> {
  try {
    return await generateArrangementFlow(input);
  } catch (error: any) {
    console.error("Error in generateArrangement:", error);
    throw new Error(`I couldn't write the music: ${error.message || 'Something went wrong.'}`);
  }
}

const arrangementPrompt = ai.definePrompt({
    name: 'generateArrangementPrompt',
    model: 'googleai/gemini-1.5-flash',
    input: { schema: GenerateArrangementInputSchema },
    output: { schema: GenerateArrangementOutputSchema },
    prompt: `You are a friendly music helper. Your job is to write a unique piano track based on what the user wants. 

**STAY ORIGINAL:**
- Use the user's mood or description to write something new.
- If lyrics are provided, the melody and rhythm should match the flow of those lyrics (e.g., if it's 'Sa Re Ga Ma', the piano should play C4 D4 E4 F4).

**MUSIC DETAILS:**
- Choose a speed (BPM) between 60-180.
- Use only the 'piano' instrument.
- Use valid Tone.js timing like '0:1:2' and durations like '4n'.

{{#if feedback}}
The user said this about the last try: "{{feedback.reason}}". Use this to make this version better.
{{/if}}

User's request: "{{prompt}}"

Return only the JSON object.`,
});

const generateArrangementFlow = ai.defineFlow(
  {
    name: 'generateArrangementFlow',
    inputSchema: GenerateArrangementInputSchema,
    outputSchema: GenerateArrangementOutputSchema,
  },
  async (input) => {
    const response = await arrangementPrompt(input);
    const output = response.output;
    if (!output) throw new Error("I couldn't write the music track. Try a different idea?");
    return output;
  }
);
