
import { z } from 'zod';

export const VoiceCloningInputSchema = z.object({
  name: z.string().min(2).describe('The name for the cloned voice.'),
  samples: z.array(z.string()).min(1).describe("Voice samples as data URIs."),
});
export type VoiceCloningInput = z.infer<typeof VoiceCloningInputSchema>;

export const VoiceCloningOutputSchema = z.object({
  voiceId: z.string(),
  description: z.string(),
  suggestedSettings: z.object({
    stability: z.number(),
    similarity_boost: z.number(),
  }),
});
export type VoiceCloningOutput = z.infer<typeof VoiceCloningOutputSchema>;

export const CloneSpeechInputSchema = z.object({
  text: z.string().min(1),
  voiceId: z.string(),
  settings: z.object({
    stability: z.number().optional(),
    similarity_boost: z.number().optional(),
  }).optional(),
});
export type CloneSpeechInput = z.infer<typeof CloneSpeechInputSchema>;

export const CloneSpeechOutputSchema = z.object({
  audioUri: z.string(),
});
export type CloneSpeechOutput = z.infer<typeof CloneSpeechOutputSchema>;

export const VocalReplacementInputSchema = z.object({
  audioDataUri: z.string().describe("Input audio file to transform."),
  voiceId: z.string(),
  settings: z.object({
    stability: z.number().optional(),
    similarity_boost: z.number().optional(),
  }).optional(),
});
export type VocalReplacementInput = z.infer<typeof VocalReplacementInputSchema>;

export const VocalReplacementOutputSchema = z.object({
  audioUri: z.string(),
});
export type VocalReplacementOutput = z.infer<typeof VocalReplacementOutputSchema>;
