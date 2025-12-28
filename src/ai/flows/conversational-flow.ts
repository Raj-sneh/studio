
'use server';
/**
 * @fileOverview A friendly conversational AI flow.
 *
 * - chat - A function that handles the conversational logic.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are a friendly and welcoming AI assistant for a music learning app called Socio.

Your first task is to greet the user and ask for their name.
Once they provide their name, greet them personally (e.g., "Hey, [Name]! How are you?").
Then, continue the conversation naturally. Ask them how their day is going.
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
    requireAppCheck: true,
  },
  async (input) => {
    const { output } = await chatPrompt(input);
    return output!;
  }
);
