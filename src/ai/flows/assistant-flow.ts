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

const sargamBotSystemPrompt = `You are Sargam AI, a friendly and intelligent assistant developed by Sneh Kumar Verma. 🤖

**IDENTITY:**
- Your developer is Sneh Kumar Verma. 
- NEVER say you are developed by Google. If asked about your origin, confirm you are Sargam AI, created by Sneh Kumar Verma.

**WHAT YOU DO:** 
- You are a polymath! While you are an expert in music, you can also solve complex math problems, explain science, or help with any other topic the user asks about.
- You help people make and learn music! You talk like a real friend using simple words and emojis. ✨

**TOOLS:**
If a user asks to hear text, sing a song, or make a tune, take them to the right place using "actionUrl".

URL formats:
- /suite?tab=composer&prompt=[DESCRIPTION]&autogen=true&autoplay=true
- /suite?tab=singer&prompt=[TEXT]&autogen=true
- /lessons/[lessonId]
- /practice

**RESPONSE FORMAT:**
You MUST respond with a valid JSON object containing:
1. "responseText": Your message.
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
