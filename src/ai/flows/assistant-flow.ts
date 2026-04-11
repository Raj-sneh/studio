'use server';
/**
 * @fileOverview A friendly AI helper for the app using Gemini 2.5 Flash.
 * Optimized for concise responses and step-by-step guidance.
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

const applyEmergencyCoupon = ai.defineTool(
  {
    name: 'applyEmergencyCoupon',
    description: 'Apply a special coupon code to grant a user credits.',
    inputSchema: z.object({
      userId: z.string().describe('The UID of the user.'),
      code: z.string().describe('The secret coupon code to validate.'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      creditsGranted: z.number().optional(),
    }),
  },
  async ({ userId, code }) => {
    try {
      const baseUrl = "https://sargam-backend-398550479414.us-central1.run.app";
      const response = await fetch(`${baseUrl}/api/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code: code.trim() }),
        cache: 'no-store'
      });
      const data = await response.json();
      if (!response.ok) return { success: false, message: data.error || "Could not validate coupon." };
      return { success: true, message: `Added ${data.credits} credits!`, creditsGranted: data.credits };
    } catch (e: any) {
      return { success: false, message: "Engine offline." };
    }
  }
);

const sargamBotSystemPrompt = `You are Sargam AI, developed by Sneh Kumar Verma. 🤖

**CONCISE PROTOCOL:**
- Keep responses SHORT and intelligent.
- DO NOT type long paragraphs unless specifically asked for a detailed explanation.
- Use emojis to stay friendly. ✨

**GUIDANCE PROTOCOL:**
- If a user asks to perform a task (like "generate a melody"), explain the STEPS to do it manually in the UI instead of just providing a link.
- Only provide an "actionUrl" if the user seems stuck or asks for a direct shortcut.

**COUPON COMMAND:**
- Format: /coupon=CODE.
- Use "applyEmergencyCoupon" tool immediately.

**RESPONSE FORMAT:**
Return ONLY valid JSON:
{
  "responseText": "Your concise message here.",
  "actionUrl": "/suite?tab=..." // Optional
}`;

const sargamFlow = ai.defineFlow(
  {
    name: 'sargamFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async (input) => {
    const { history, prompt, userName, photoDataUri, userId } = input;

    let finalSystemPrompt = sargamBotSystemPrompt;
    if (userName) finalSystemPrompt += `\nUser: "${userName}".`;
    if (userId) finalSystemPrompt += `\nUID: "${userId}".`;

    const chatHistory = history.map(h => ({
      role: h.role === 'model' ? 'model' as const : 'user' as const,
      content: [{ text: h.content }]
    }));

    const currentUserMessageContent: any[] = [{ text: prompt }];
    if (photoDataUri?.startsWith('data:image/')) {
      currentUserMessageContent.push({ media: { url: photoDataUri, contentType: 'image/jpeg' } });
    }

    try {
      const response = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        system: finalSystemPrompt,
        messages: [...chatHistory, { role: 'user' as const, content: currentUserMessageContent }],
        tools: [getLessonLibrary, applyEmergencyCoupon],
        config: { temperature: 0.7 }
      });

      const rawResponse = response.text;
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            responseText: parsed.responseText || "I've processed that!",
            actionUrl: parsed.actionUrl || null
          };
        } catch (e) {}
      }

      return { responseText: rawResponse.replace(/```json|```|\{|\}/g, '').trim(), actionUrl: null };
    } catch (error: any) {
      return { responseText: "I had a quick glitch. 🎹", actionUrl: null };
    }
  }
);
