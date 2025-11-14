'use server';

/**
 * @fileOverview This file defines the Genkit flow for analyzing user performance in AI Teacher mode.
 *
 * The flow takes the user's recorded notes and the expected notes as input,
 * analyzes the performance, and provides feedback on strengths and weaknesses.
 *
 * @interface AnalyzeUserPerformanceInput - Defines the input schema for the analyzeUserPerformance function.
 * @interface AnalyzeUserPerformanceOutput - Defines the output schema for the analyzeUserPerformance function.
 * @function analyzeUserPerformance - The main exported function that triggers the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeUserPerformanceInputSchema = z.object({
  recordedNotes: z
    .array(z.string())
    .describe('An array of notes recorded by the user.'),
  expectedNotes: z.array(z.string()).describe('An array of notes expected to be played.'),
  instrument: z.enum(['piano', 'guitar', 'drums', 'violin']).describe('The instrument being played.'),
});
export type AnalyzeUserPerformanceInput = z.infer<
  typeof AnalyzeUserPerformanceInputSchema
>;

const AnalyzeUserPerformanceOutputSchema = z.object({
  overallScore: z
    .number()
    .describe('An overall score representing the user performance.'),
  strengths: z
    .string()
    .describe('A description of the user’s strengths based on their playing.'),
  weaknesses: z
    .string()
    .describe('A description of the user’s weaknesses and areas for improvement.'),
});
export type AnalyzeUserPerformanceOutput = z.infer<
  typeof AnalyzeUserPerformanceOutputSchema
>;

export async function analyzeUserPerformance(
  input: AnalyzeUserPerformanceInput
): Promise<AnalyzeUserPerformanceOutput> {
  return analyzeUserPerformanceFlow(input);
}

const analyzeUserPerformancePrompt = ai.definePrompt({
  name: 'analyzeUserPerformancePrompt',
  input: {schema: AnalyzeUserPerformanceInputSchema},
  output: {schema: AnalyzeUserPerformanceOutputSchema},
  prompt: `You are an AI music teacher providing feedback to a student based on their performance.

  Analyze the student's performance, considering both the notes they played and the notes they were supposed to play on the instrument they are playing.

  Provide an overall score, describe the student's strengths, and identify areas for improvement.
  Be specific and constructive in your feedback.

  The student played the following notes: {{{recordedNotes}}}
  The expected notes were: {{{expectedNotes}}}
  Instrument: {{{instrument}}}
  `,
});

const analyzeUserPerformanceFlow = ai.defineFlow(
  {
    name: 'analyzeUserPerformanceFlow',
    inputSchema: AnalyzeUserPerformanceInputSchema,
    outputSchema: AnalyzeUserPerformanceOutputSchema,
  },
  async input => {
    const {output} = await analyzeUserPerformancePrompt(input);
    return output!;
  }
);
