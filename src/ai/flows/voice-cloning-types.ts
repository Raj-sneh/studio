import { z } from 'zod';

export const VoiceCloningInputSchema = z.object({
  name: z.string().min(2).describe('The name for the cloned voice.'),
  samples: z.array(z.string()).min(1).describe("List of voice samples as data URIs. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type VoiceCloningInput = z.infer<typeof VoiceCloningInputSchema>;

export const VoiceCloningOutputSchema = z.object({
  voiceId: z.string().describe('The unique ID of the cloned voice from ElevenLabs.'),
  description: z.string().describe('The AI-generated description of the voice pattern.'),
  suggestedSettings: z.object({
    stability: z.number().describe('Suggested stability setting (0-1).'),
    similarity_boost: z.number().describe('Suggested similarity boost setting (0-1).'),
  }).describe('AI-suggested neural settings for this specific voice.'),
});
export type VoiceCloningOutput = z.infer<typeof VoiceCloningOutputSchema>;

export const CloneSpeechInputSchema = z.object({
  text: z.string().min(1).describe('Text for the cloned voice to speak.'),
  voiceId: z.string().describe('The ElevenLabs Voice ID to use.'),
  settings: z.object({
    stability: z.number().optional(),
    similarity_boost: z.number().optional(),
  }).optional().describe('Neural settings for generation.'),
});
export type CloneSpeechInput = z.infer<typeof CloneSpeechInputSchema>;

export const CloneSpeechOutputSchema = z.object({
  audioUri: z.string().describe('The base64 encoded MP3 audio data URI.'),
});
export type CloneSpeechOutput = z.infer<typeof CloneSpeechOutputSchema>;
