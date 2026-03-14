import { z } from 'zod';

export const AiNoteSchema = z.object({
  instrument: z.enum(['piano']).describe("The instrument for this note."),
  key: z.union([z.string(), z.array(z.string())]).describe("The musical note(s) to play. E.g., 'C4' or ['C4', 'E4', 'G4']."),
  time: z.string().describe("The start time in Tone.js Transport format (bar:beat:sixteenth). E.g., '0:1:2'."),
  duration: z.string().describe("The note duration in Tone.js notation. E.g., '8n', '4n'."),
});
export type AiNote = z.infer<typeof AiNoteSchema>;

export const GenerateArrangementInputSchema = z.object({
  prompt: z.string().describe("A description of the song to generate, like a song title, lyrics, or a mood."),
  feedback: z
    .object({
      prompt: z
        .string()
        .describe('The prompt for the previous, rated generation.'),
      rating: z
        .enum(['good', 'bad'])
        .describe("The user's rating of the previous generation."),
      reason: z.string().optional().describe("Specific reason for the bad rating, e.g., 'Melody doesn't match', 'Tune is too fast'."),
    })
    .optional()
    .describe(
      'User feedback on a previous generation to guide the new one.'
    ),
});
export type GenerateArrangementInput = z.infer<typeof GenerateArrangementInputSchema>;

export const GenerateArrangementOutputSchema = z.object({
  tempo: z.number().min(60).max(180).describe('The overall tempo of the song in beats per minute (BPM).'),
  notes: z.array(AiNoteSchema).describe("A single, flat array of all musical notes for the entire arrangement."),
});
export type GenerateArrangementOutput = z.infer<typeof GenerateArrangementOutputSchema>;