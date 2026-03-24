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
    prompt: 'Generate 3 very short (max 10 words each) and highly expressive sentences that a user can read to provide a high-quality voice sample for cloning. Include different moods: one energetic/happy, one calm/serious, and one questioning/curious.',
    output: { schema: TrainingScriptOutputSchema },
  });

  return result.output?.scripts || [
    "I'm so excited to finally start my music journey!",
    "The piano sounds beautiful in this quiet room.",
    "Can you hear the magic hidden within the notes?"
  ];
}
