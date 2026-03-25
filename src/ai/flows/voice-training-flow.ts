'use server';
/**
 * @fileOverview A flow to generate a single, expressive script for voice cloning training.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TrainingScriptOutputSchema = z.object({
  script: z.string().describe('A single, expressive paragraph of 30-40 words for voice recording.'),
});

/**
 * Generates a medium-length, phonetically rich paragraph for training.
 */
export async function generateTrainingParagraph(): Promise<string> {
  const result = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: 'Generate a single, highly expressive and phonetically diverse paragraph of approximately 35 words. The paragraph should be engaging and include various emotional tones (e.g., excitement, calm, and curiosity) to provide a rich voice sample for high-quality neural cloning.',
    output: { schema: TrainingScriptOutputSchema },
  });

  return result.output?.script || "Music is a journey that starts with a single note. I am so excited to explore the infinite possibilities of sound, but I also find peace in the quiet moments between the melodies. Do you feel it too?";
}
