'use server';
/**
 * @fileOverview A Genkit flow to generate a short poem about a given topic.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import 'dotenv/config';

const PoemGeneratorInputSchema = z.object({
  topic: z.string().describe('The topic for the poem.'),
});
export type PoemGeneratorInput = z.infer<typeof PoemGeneratorInputSchema>;

const PoemGeneratorOutputSchema = z.object({
  poem: z.string().describe('The generated poem.'),
});
export type PoemGeneratorOutput = z.infer<typeof PoemGeneratorOutputSchema>;


export async function generatePoem(input: PoemGeneratorInput): Promise<PoemGeneratorOutput> {
    return poemGeneratorFlow(input);
}


const poemGeneratorFlow = ai.defineFlow(
    {
      name: 'poemGeneratorFlow',
      inputSchema: PoemGeneratorInputSchema,
      outputSchema: PoemGeneratorOutputSchema,
    },
    async (input) => {
      const llmResponse = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: `You are a poet. Write a short, four-line poem about the following topic: ${input.topic}`,
      });
  
      return { poem: llmResponse.text };
    }
  );