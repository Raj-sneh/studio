'use server';
/**
 * @fileOverview A flow to generate short, expressive scripts for voice cloning training.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TrainingScriptOutputSchema = z.object({
  scripts: z.array(z.string()).describe('A list of 3 short, expressive sentences for voice recording.'),
});

export async function generateTrainingParagraphs(): Promise<string[]> {
  const result = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: 'Generate 3 very short (1 sentence each) and expressive sentences that a user can read to provide a high-quality voice sample for cloning. Include different moods: one happy, one calm, and one dramatic.',
    output: { schema: TrainingScriptOutputSchema },
  });

  return result.output?.scripts || [
    "The golden sun sets slowly behind the purple mountains, casting long shadows across the valley.",
    "I can't believe we actually found the hidden treasure buried beneath the old oak tree!",
    "Please speak clearly and maintain a consistent volume while reading this training sentence."
  ];
}
