import { z } from 'zod';
import { AiNoteSchema } from './generate-arrangement-types';

export const GenerateBgmInputSchema = z.object({
  vocalAudioUri: z.string().describe("The user's vocal recording as a data URI. Format: 'data:<mimetype>;base64,<encoded_data>'."),
  mood: z.string().optional().describe("Optional mood hint for the background music."),
});
export type GenerateBgmInput = z.infer<typeof GenerateBgmInputSchema>;

export const GenerateBgmOutputSchema = z.object({
  tempo: z.number().min(60).max(180).describe('The detected or suggested tempo in BPM.'),
  notes: z.array(AiNoteSchema).describe("A flat array of piano notes synchronized with the vocal input."),
  analysis: z.string().describe("A short explanation of why this arrangement fits the vocal."),
});
export type GenerateBgmOutput = z.infer<typeof GenerateBgmOutputSchema>;
