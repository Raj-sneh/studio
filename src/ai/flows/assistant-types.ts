import { z } from 'zod';

export const AssistantInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).describe('The conversation history.'),
  prompt: z.string().describe("The user's latest prompt or question."),
  userName: z.string().optional().nullable().describe('The name of the user making the request.'),
  photoDataUri: z.string().optional().nullable().describe("A photo as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

export const AssistantOutputSchema = z.object({
  responseText: z.string().describe("The AI assistant's text response to the user. This is what will be displayed in the chat."),
  actionUrl: z.string().optional().describe('A URL to navigate to for performing a website action. Should be a relative path and include query parameters for the action, e.g., /suite?tab=ai-band&prompt=...&autogen=true'),
}).describe("The AI assistant's response, which can include a text reply and a website action.");
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;
