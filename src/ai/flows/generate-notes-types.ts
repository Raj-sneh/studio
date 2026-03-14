import {z} from 'zod';

export const GenerateNotesInputSchema = z.object({
  text: z.string().describe('The text or song title to be converted into a piano melody.'),
  feedback: z.object({
    previousPrompt: z.string().describe('The prompt used for the previous generation.'),
    rating: z.enum(['good', 'bad']).describe('The user rating.'),
    comment: z.string().optional().describe('Specific corrections from the user.'),
  }).optional().describe('User feedback to refine the next generation.'),
});
export type GenerateNotesInput = z.infer<typeof GenerateNotesInputSchema>;

export const NoteObjectSchema = z.object({
  key: z.string().describe("The musical note, e.g., 'C4'."),
  duration: z.string().describe("The note duration in Tone.js notation, e.g., '8n', '4n', '2n', '16n'."),
  time: z.string().describe("The start time in Tone.js Transport format (bar:beat:sixteenth). E.g., '0:1:2'."),
});
export type NoteObject = z.infer<typeof NoteObjectSchema>;

export const GenerateNotesOutputSchema = z.object({
  tempo: z.number().min(60).max(180).describe('The overall tempo of the song in beats per minute (BPM).'),
  notes: z.array(NoteObjectSchema).describe('An array of note objects representing the precise melody.'),
});
export type GenerateNotesOutput = z.infer<typeof GenerateNotesOutputSchema>;
