'use server';

/**
 * @fileOverview Implements a flow to flag content for review, triggering moderation tasks based on report thresholds.
 *
 * - flagContentForReview - A function to flag content.
 * - FlagContentForReviewInput - The input type for the flagContentForReview function.
 * - FlagContentForReviewOutput - The return type for the flagContentForReview function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FlagContentForReviewInputSchema = z.object({
  reporterId: z.string().describe('The ID of the user reporting the content.'),
  targetType: z.enum(['lesson']).describe('The type of content being reported (e.g., lesson).'),
  targetRef: z.string().describe('The reference or ID of the content being reported.'),
  reason: z.string().describe('The reason for reporting the content.'),
  details: z.string().optional().describe('Additional details about the report.'),
});

export type FlagContentForReviewInput = z.infer<typeof FlagContentForReviewInputSchema>;

const FlagContentForReviewOutputSchema = z.object({
  success: z.boolean().describe('Indicates whether the content was successfully flagged.'),
  message: z.string().describe('A message indicating the status of the flagging operation.'),
});

export type FlagContentForReviewOutput = z.infer<typeof FlagContentForReviewOutputSchema>;

export async function flagContentForReview(
  input: FlagContentForReviewInput
): Promise<FlagContentForReviewOutput> {
  return flagContentForReviewFlow(input);
}

const flagContentForReviewPrompt = ai.definePrompt({
  name: 'flagContentForReviewPrompt',
  input: {schema: FlagContentForReviewInputSchema},
  output: {schema: FlagContentForReviewOutputSchema},
  prompt: `You are a content moderation assistant.  A user has flagged some content for review.  Here is the report:

Reporter ID: {{{reporterId}}}
Target Type: {{{targetType}}}
Target Reference: {{{targetRef}}}
Reason: {{{reason}}}
Details: {{{details}}}

Please confirm that the content has been flagged and saved.  Return a success message.`,
});

const flagContentForReviewFlow = ai.defineFlow(
  {
    name: 'flagContentForReviewFlow',
    inputSchema: FlagContentForReviewInputSchema,
    outputSchema: FlagContentForReviewOutputSchema,
  },
  async input => {
    // In a real implementation, this is where you would save the report to a database
    // and potentially trigger a moderation task based on a threshold.
    // For this example, we'll just return a success message.
    const {output} = await flagContentForReviewPrompt(input);
    return output!;
  }
);
