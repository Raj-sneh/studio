import { z } from 'zod';
import { AiNoteSchema } from './generate-arrangement-types';

export const VocalStyleSchema = z.enum(['male', 'female', 'duet', 'combined', 'clara', 'james', 'alex', 'marcus', 'silas', 'elena', 'maya', 'victor', 'sophie', 'kai']);
export type VocalStyle = z.infer<typeof VocalStyleSchema>;

export const GenerateSongInputSchema = z.object({
  lyrics: z.string().min(10, { message: 'Please provide at least 10 characters of lyrics.' }).describe('The lyrics for the song.'),
  vocalStyle: VocalStyleSchema.describe("The desired vocal style or specific voice name."),
  selectedVoices: z.array(z.string()).optional().describe("Array of voice names for combined mode."),
  instruments: z.array(z.enum(['piano'])).optional().describe("Background instruments to include."),
  feedback: z.object({
    rating: z.enum(['good', 'bad']),
    comment: z.string().optional(),
  }).optional().describe('Feedback from a previous generation to improve the next one.'),
});
export type GenerateSongInput = z.infer<typeof GenerateSongInputSchema>;

export const GenerateSongOutputSchema = z.object({
  tempo: z.number().min(60).max(180).describe('The overall tempo of the song in BPM.'),
  notes: z.array(AiNoteSchema).describe('An array of all musical notes for the instrumental arrangement.'),
  vocalAudioUri: z.string().describe('The base64 encoded WAV audio data URI for the vocals.'),
  title: z.string().describe('A suitable title for the generated song based on the lyrics.'),
});
export type GenerateSongOutput = z.infer<typeof GenerateSongOutputSchema>;