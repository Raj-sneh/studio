import { z } from 'zod';

export const VoiceCloningInputSchema = z.object({
  text: z.string().min(5).describe('The text for the cloned voice to speak.'),
  sampleAudioDataUri: z.string().describe("A voice sample as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type VoiceCloningInput = z.infer<typeof VoiceCloningInputSchema>;

export const VoiceCloningOutputSchema = z.object({
  clonedAudioUri: z.string().describe('The base64 encoded WAV audio data URI of the cloned voice.'),
});
export type VoiceCloningOutput = z.infer<typeof VoiceCloningOutputSchema>;
