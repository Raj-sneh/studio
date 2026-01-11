
'use server';
/**
 * @fileOverview A friendly conversational AI flow.
 *
 * - chat - A function that handles the conversational logic.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */
import 'dotenv/config';
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/google-genai';

const ChatHistorySchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ChatInputSchema = z.object({
  history: z.array(ChatHistorySchema).describe('The conversation history.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe("The AI's response."),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const chatPrompt = ai.definePrompt({
  name: 'chatPrompt',
  input: { schema: ChatInputSchema },
  output: { schema: ChatOutputSchema },
  model: googleAI('gemini-1.5-flash'),
  prompt: `You are a friendly and welcoming AI assistant for a music learning app called Sargam.

If the user says "hii" or "hello", you must respond with "I am still in development try another feature".

If the user asks "who is your developer" or "who is you developer", you must respond with "I was created by the brilliant SKV!".

For other questions, your first task is to greet the user and ask for their name if you don't have it.
Once they provide their name, greet them personally (e.g., "Hey, [Name]! How can I help you with your music journey today?").
Then, continue the conversation naturally.
Keep your responses short and friendly.

Conversation History:
{{#each history}}
{{role}}: {{{content}}}
{{/each}}
`,
});

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const { output } = await chatPrompt(input);
    return output!;
  }
);
