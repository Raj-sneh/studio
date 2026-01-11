
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ConversationalInputSchema = z.string();
const ConversationalOutputSchema = z.string();

export async function conversationalFlow(
  prompt: z.infer<typeof ConversationalInputSchema>
): Promise<z.infer<typeof ConversationalOutputSchema>> {
  const lowerCasePrompt = prompt.toLowerCase();
  
  if (lowerCasePrompt.includes('who is your developer') || lowerCasePrompt.includes('who made you') || lowerCasePrompt.includes('developer')) {
    return 'Sneh Kumar Verma';
  }
  
  return 'I am still in development mode try another feature';
}
