
'use server';
/**
 * @fileOverview This file defines the Genkit flow for analyzing a user's musical performance.
 *
 * It compares the user's played notes against the correct notes of a lesson and provides
 * scores for accuracy and timing, along with qualitative feedback.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Note } from '@/types';

// Define the schema for a single note
const NoteSchema = z.object({
  key: z.string().describe('e.g., C4'),
  duration: z.string().describe("Tone.js duration, e.g., '8n', '4n'"),
  time: z.string().describe("Tone.js time, e.g., '0:0:1'"),
});

// Define the input schema for the flow
const AnalyzePerformanceInputSchema = z.object({
  lessonNotes: z.array(NoteSchema).describe("The correct notes for the lesson."),
  userNotes: z.array(NoteSchema).describe("The notes the user played."),
});
export type AnalyzePerformanceInput = z.infer<typeof AnalyzePerformanceInputSchema>;

// Define the output schema for the flow
const AnalyzePerformanceOutputSchema = z.object({
  accuracy: z.number().min(0).max(100).describe("The percentage of correctly played notes."),
  timing: z.number().min(0).max(100).describe("The percentage of notes played with correct timing."),
  feedback: z.string().describe("Friendly and constructive feedback for the user."),
});
export type AnalyzePerformanceOutput = z.infer<typeof AnalyzePerformanceOutputSchema>;

// Export the main function that will be called from the frontend
export async function analyzeUserPerformance(
  input: AnalyzePerformanceInput
): Promise<AnalyzePerformanceOutput> {
  return analyzePerformanceFlow(input);
}

// Define the Genkit prompt
const analyzePerformancePrompt = ai.definePrompt({
  name: 'analyzePerformancePrompt',
  input: { schema: AnalyzePerformanceInputSchema },
  output: { schema: AnalyzePerformanceOutputSchema },

  prompt: `You are an AI music teacher. Your goal is to provide encouraging and helpful feedback to a student learning a song.

    Analyze the user's performance by comparing their played notes to the lesson's correct notes.
    
    1.  **Calculate Accuracy**: Determine the percentage of notes the user played correctly.
    2.  **Calculate Timing**: Assess how well the user's timing matched the lesson.
    3.  **Generate Feedback**: Based on the accuracy and timing, provide short, specific, and encouraging feedback.
        - If they did well (e.g., >80% on both), praise them and perhaps suggest a minor point for improvement.
        - If they struggled, be encouraging. Point out one or two key areas to focus on (e.g., "Great start! Let's try to focus on the rhythm of the first few notes.").
        - Keep the feedback concise (2-3 sentences).

    **Lesson Notes (Correct):**
    \`\`\`json
    {{{JSON.stringify lessonNotes}}}
    \`\`\`

    **User's Notes (Played):**
    \`\`\`json
    {{{JSON.stringify userNotes}}}
    \`\`\`
    `,
});


// Define the Genkit flow
const analyzePerformanceFlow = ai.defineFlow(
  {
    name: 'analyzePerformanceFlow',
    inputSchema: AnalyzePerformanceInputSchema,
    outputSchema: AnalyzePerformanceOutputSchema,
  },
  async (input) => {
    const { output } = await analyzePerformancePrompt(input);
    return output!;
  }
);
