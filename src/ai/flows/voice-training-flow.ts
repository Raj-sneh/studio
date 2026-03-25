'use server';
/**
 * @fileOverview A flow to generate a single, expressive script for voice cloning training.
 * Optimized for high-quality neural capture for the SKV AI engine.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TrainingScriptOutputSchema = z.object({
  script: z.string().describe('A single, expressive paragraph of 30-40 words for voice recording.'),
});

/**
 * Generates a medium-length, phonetically rich paragraph for training.
 * Includes a robust fallback to ensure the UI never fails if the LLM is busy.
 */
export async function generateTrainingParagraph(): Promise<string> {
  const fallbackScript = "Music is a journey that starts with a single note. I am so excited to explore the infinite possibilities of sound, but I also find peace in the quiet moments between the melodies. Do you feel it too?";
  
  try {
    const result = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: 'Generate a single, highly expressive and phonetically diverse paragraph of approximately 35 words. The paragraph should be engaging and include various emotional tones (e.g., excitement, calm, and curiosity) to provide a rich voice sample for high-quality neural cloning.',
      output: { schema: TrainingScriptOutputSchema },
      config: {
        temperature: 0.8,
      }
    });

    return result.output?.script || fallbackScript;
  } catch (error) {
    console.error("SKV AI Training Script Generation Error:", error);
    // Return fallback directly to ensure user experience isn't broken
    return fallbackScript;
  }
}
