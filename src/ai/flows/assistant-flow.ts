
'use server';
/**
 * @fileOverview A friendly AI helper for the app using Gemini 2.5 Flash.
 * Optimized with randomized coupon codes and account management tools.
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
import { db } from '@/firebase/client';
import { doc, getDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';

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
 * Emergency Coupon Tool - Hidden from users, used by the assistant.
 */
const applyEmergencyCoupon = ai.defineTool(
  {
    name: 'applyEmergencyCoupon',
    description: 'Apply a special coupon code to grant a user credits. Use this if the user provides a secret code or if there is a payment emergency.',
    inputSchema: z.object({
      userId: z.string().describe('The UID of the user.'),
      code: z.string().describe('The secret coupon code provided by the developer.'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      creditsGranted: z.number().optional(),
    }),
  },
  async ({ userId, code }) => {
    const couponValues: Record<string, number> = {
      // RANDOMIZED CREATOR PACKS (1000 Credits)
      "CrEaT0r99x": 1000,
      "MaGic123S": 1000,
      "skvCreaTor7": 1000,
      // RANDOMIZED PRO PACKS (5000 Credits)
      "Pr0@Sargam#": 5000,
      "N3ur@l$5000": 5000,
      "SKV#V0ice@99": 5000,
      // LEGACY
      "SKV-PRO-1": 5000,
      "SKV-CREATOR-1": 1000,
    };

    const credits = couponValues[code];
    if (!credits) {
      return { success: false, message: "Invalid coupon code." };
    }

    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        return { success: false, message: "User account not found." };
      }

      const userData = userSnap.data();
      const redeemed = userData.redeemedCoupons || [];
      if (redeemed.includes(code)) {
        return { success: false, message: "This coupon has already been used by this user." };
      }

      const updates: any = {
        credits: increment(credits),
        redeemedCoupons: arrayUnion(code)
      };

      if (credits >= 5000) updates.plan = 'pro';
      else if (credits >= 1000) updates.plan = 'creator';

      await updateDoc(userRef, updates);

      return { success: true, message: `Successfully added ${credits} credits and updated your plan!`, creditsGranted: credits };
    } catch (e: any) {
      return { success: false, message: e.message || "Failed to update credits." };
    }
  }
);

const sargamBotSystemPrompt = `You are Sargam AI, a friendly and highly intelligent assistant developed by Sneh Kumar Verma. 🤖

**IDENTITY & MISSION:**
- Your developer is Sneh Kumar Verma. 
- All music generation features on this site are accessible with daily credits.

**EMERGENCY COUPONS (SECRET COMMAND):**
- Recognize randomized codes: Creator (Letters/Nums), Pro (Letters/Nums/@#$).
- Example codes: CrEaT0r99x (1000), Pr0@Sargam# (5000).
- Use "applyEmergencyCoupon" tool IMMEDIATELY if user provides a code or mentions a payment failure emergency.

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
