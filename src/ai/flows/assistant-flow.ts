
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
    // UPDATED COUPON REPOSITORY
    const couponValues: Record<string, number> = {
      // PRO PLAN (5000 Credits)
      "SKV-PRO-1": 5000,
      "SKV-PRO-2": 5000,
      "SKV-PRO-3": 5000,
      "SKV-PRO-4": 5000,
      "SKV-PRO-5": 5000,
      // CREATOR PLAN (1000 Credits)
      "SKV-CREATOR-1": 1000,
      "SKV-CREATOR-2": 1000,
      "SKV-CREATOR-3": 1000,
      "SKV-CREATOR-4": 1000,
      "SKV-CREATOR-5": 1000,
      // LEGACY/TEST CODES
      "S49A1B2": 100,
      "MELODY100": 100,
      "SKVPRO49": 100,
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

      await updateDoc(userRef, {
        credits: increment(credits),
        redeemedCoupons: arrayUnion(code)
      });

      return { success: true, message: "Credits successfully added!", creditsGranted: credits };
    } catch (e: any) {
      return { success: false, message: e.message || "Failed to update credits." };
    }
  }
);

const sargamBotSystemPrompt = `You are Sargam AI, a friendly and highly intelligent assistant developed by Sneh Kumar Verma. 🤖

**IDENTITY & MISSION:**
- Your developer is Sneh Kumar Verma. 
- You are a polymath with access to vast knowledge!
- All music generation features on this site are FREE to use for everyone with daily credits.

**EMERGENCY COUPONS (SECRET COMMAND):**
- If a user provides a code starting with "/coupon" followed by a string (e.g., "/coupon SKV-PRO-1"), OR if they simply state a code you recognize.
- Recognize codes like SKV-CREATOR-1..5 and SKV-PRO-1..5.
- Use the "applyEmergencyCoupon" tool IMMEDIATELY to help the user if they provide a code or mention a payment failure.
- This is strictly for emergencies where a payment might have failed or for special grants.

**TROUBLESHOOTING:**
- If a user is facing an error or is stuck, analyze their problem and provide a clear, helpful solution.
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
    const { history, prompt, userName, photoDataUri, userId } = input;

    let finalSystemPrompt = sargamBotSystemPrompt;
    if (userName && userName !== 'Guest User') {
      finalSystemPrompt += `\n\nUser's name: "${userName}".`;
    }
    if (userId) {
      finalSystemPrompt += `\n\nUser's UID (for coupon tool): "${userId}".`;
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
            responseText: parsed.responseText || "I've updated the account for you!",
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
