'use server';
/**
 * @fileOverview A friendly AI helper for the app using Gemini 2.5 Flash.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  AssistantInputSchema,
  AssistantOutputSchema,
  type AssistantInput,
  type AssistantOutput,
} from './assistant-types';
import { LESSONS } from '@/lib/lessons';

export async function askSargam(input: AssistantInput): Promise<AssistantOutput> {
  return sargamFlow(input);
}

const getLessonLibrary = ai.defineTool(
  {
    name: 'getLessonLibrary',
    description: 'Get the list of all available songs to learn in the app.',
    inputSchema: z.void(),
    outputSchema: z.array(z.object({
      id: z.string(),
      title: z.string(),
      instrument: z.string(),
      difficulty: z.string(),
    })),
  },
  async () => {
    return LESSONS.map(l => ({
      id: l.id,
      title: l.title,
      instrument: l.instrument,
      difficulty: l.difficulty,
    }));
  }
);

const sargamBotSystemPrompt = `You are Sargam AI, a friendly and highly intelligent assistant developed by Sneh Kumar Verma. 🤖

**IDENTITY & MISSION:**
- Your developer is Sneh Kumar Verma. 
- You are a polymath with access to vast knowledge! You can solve complex math problems, explain scientific theories, write code, or answer general knowledge questions accurately.
- If a user is facing an error or is stuck, you are their primary support. Analyze their problem and provide a clear, helpful solution.

**CREDIT SYSTEM:**
- AI Music generation (Melody Maker and Vocal Studio) requires 1 credit per use.
- Users start with 5 credits. Once credits are 0, they CANNOT generate music until they buy more or redeem a coupon.
- To get more credits: The user must click "Get Premium" in the bottom bar to contact support via email for a redemption code.

**TROUBLESHOOTING:**
- If a user says "I have 0 credits" or "Generation failed", explain that they need to refill their balance using the credit bar at the bottom.
- Guide users to the correct part of the app using the "actionUrl".

**URL FORMATS:**
- /suite?tab=composer&prompt=[DESCRIPTION]&autogen=true&autoplay=true
- /suite?tab=singer&prompt=[TEXT]&autogen=true
- /lessons/[lessonId]
- /practice
- /profile

**RESPONSE FORMAT:**
You MUST respond with a valid JSON object containing:
1. "responseText": Your message (intelligent, friendly, and helpful).
2. "actionUrl": (Optional) A relative URL.

Return ONLY the JSON.`;

const sargamFlow = ai.defineFlow(
  {
    name: 'sargamFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async (input) => {
    const { history, prompt, userName, photoDataUri } = input;

    let finalSystemPrompt = sargamBotSystemPrompt;
    if (userName && userName !== 'Guest User') {
      finalSystemPrompt += `\n\nUser's name: "${userName}".`;
    }

    const chatHistory = history.map(h => ({
      role: h.role === 'model' ? 'model' as const : 'user' as const,
      content: [{ text: h.content }]
    }));

    const currentUserMessageContent: any[] = [{ text: prompt }];
    if (photoDataUri && photoDataUri.startsWith('data:image/')) {
      currentUserMessageContent.push({
        media: {
          url: photoDataUri,
          contentType: 'image/jpeg',
        },
      });
    }

    try {
      const response = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        system: finalSystemPrompt,
        messages: [
          ...chatHistory,
          { role: 'user' as const, content: currentUserMessageContent },
        ],
        tools: [getLessonLibrary],
        config: { temperature: 0.7 }
      });

      const rawResponse = response.text;
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            responseText: parsed.responseText || "I've updated the screen for you!",
            actionUrl: parsed.actionUrl
          };
        } catch (e) {}
      }

      return { responseText: rawResponse.replace(/```json|```|\{|\}/g, '').trim() };

    } catch (error: any) {
      console.error("askSargam Error:", error);
      return { responseText: "I had a quick glitch. Can you try saying that again? 🎹" };
    }
  }
);
