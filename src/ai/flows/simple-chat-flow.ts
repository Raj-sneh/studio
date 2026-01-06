
'use server';
/**
 * @fileOverview A simple Genkit flow that explains a concept.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import 'dotenv/config';

const SimpleChatInputSchema = z.object({
  prompt: z.string().describe('The user\'s question or prompt.'),
});
export type SimpleChatInput = z.infer<typeof SimpleChatInputSchema>;

const SimpleChatOutputSchema = z.object({
  response: z.string().describe('The AI\'s response.'),
});
export type SimpleChatOutput = z.infer<typeof SimpleChatOutputSchema>;


export async function simpleChat(input: SimpleChatInput): Promise<SimpleChatOutput> {
    return simpleChatFlow(input);
}


const simpleChatFlow = ai.defineFlow(
    {
      name: 'simpleChatFlow',
      inputSchema: SimpleChatInputSchema,
      outputSchema: SimpleChatOutputSchema,
    },
    async (input) => {
      const llmResponse = await ai.generate({
        model: 'gemini-1.5-flash-latest',
        prompt: input.prompt,
      });
  
      return { response: llmResponse.text };
    }
  );
  
