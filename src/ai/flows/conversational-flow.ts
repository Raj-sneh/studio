
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
  
  return 'As an AI music assistant, my capabilities are still evolving. For now, I can tell you about my developer. What would you like to know?';
}
