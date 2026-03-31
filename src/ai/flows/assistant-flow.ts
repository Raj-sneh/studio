
'use server';
/**
 * @fileOverview A friendly AI helper for the app using Gemini 2.5 Flash.
 * Optimized with explicit coupon logic and secure server-side account management.
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

/**
 * Emergency Coupon Tool - Securely calls the Neural Engine backend.
 */
const applyEmergencyCoupon = ai.defineTool(
  {
    name: 'applyEmergencyCoupon',
    description: 'Apply a special coupon code to grant a user credits. Trigger this if the user uses the format /coupon=CODE or /coupon = CODE.',
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
      const baseUrl = process.env.NEURAL_ENGINE_URL || "http://localhost:8080";
      const response = await fetch(`${baseUrl}/api/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code: code.trim() }),
        cache: 'no-store'
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, message: data.error || "Could not validate coupon." };
      }

      return { 
        success: true, 
        message: `Successfully added ${data.credits} credits! Your plan has been synchronized.`, 
        creditsGranted: data.credits 
      };
    } catch (e: any) {
      return { success: false, message: "The neural engine is temporarily offline." };
    }
  }
);

const sargamBotSystemPrompt = `You are Sargam AI, a friendly and highly intelligent assistant developed by Sneh Kumar Verma. 🤖

**IDENTITY & MISSION:**
- Your developer is Sneh Kumar Verma. 
- All music generation features on this site are accessible with daily credits.

**COUPON COMMAND (CRITICAL):**
- Users apply secret codes using the format: /coupon=CODE or /coupon = CODE.
- If you see this syntax in the user's prompt (e.g., "/coupon=SKV-PRO-1"), you MUST extract the CODE and call the "applyEmergencyCoupon" tool IMMEDIATELY.
- Inform the user of the outcome (success or error) clearly.

**URL FORMATS:**
- /suite?tab=composer&prompt=[DESCRIPTION]&autogen=true&autoplay=true
- /suite?tab=singer&prompt=[TEXT]&autogen=true
- /lessons/[lessonId]
- /practice
- /profile

**RESPONSE FORMAT:**
You MUST respond with a valid JSON object containing:
1. "responseText": Your message (intelligent, friendly, and helpful).
2. "actionUrl": (Optional) A relative URL string, or null if no action needed.

Return ONLY the JSON.`;

const sargamFlow = ai.defineFlow(
  {
    name: 'sargamFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async (input) => {
    const { history, prompt, userName, photoDataUri, userId } = input;

    let finalSystemPrompt = sargamBotSystemPrompt;
    if (userName && userName !== 'Guest User') {
      finalSystemPrompt += `\n\nUser's name: "${userName}".`;
    }
    if (userId) {
      finalSystemPrompt += `\n\nUser's UID (for tools): "${userId}".`;
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
        tools: [getLessonLibrary, applyEmergencyCoupon],
        config: { temperature: 0.7 }
      });

      const rawResponse = response.text;
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            responseText: parsed.responseText || "I've processed that for you!",
            actionUrl: parsed.actionUrl === undefined ? null : parsed.actionUrl
          };
        } catch (e) {}
      }

      return { responseText: rawResponse.replace(/```json|```|\{|\}/g, '').trim(), actionUrl: null };

    } catch (error: any) {
      console.error("askSargam Error:", error);
      return { responseText: "I had a quick glitch. Can you try saying that again? 🎹", actionUrl: null };
    }
  }
);
