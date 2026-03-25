import { z } from 'zod';

export const voiceOptions = [
  'clive',
  'clara',
  'james',
  'alex',
  'marcus',
  'silas',
  'elena',
  'maya',
  'victor',
  'sophie',
  'kai',
  'duet',
  'male',
  'female',
  'combined'
] as const;
export type VoiceOption = typeof voiceOptions[number];

export const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Italian', value: 'it' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Portuguese', value: 'pt' },
] as const;

export const TextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
  voice: z.enum(voiceOptions).describe('The selected voice.'),
  sing: z.boolean().describe('Whether the AI should sing the text.'),
  language: z.string().optional().default('en').describe('The language code for synthesis.'),
  rate: z.enum(['slow', 'medium', 'fast']).optional().describe('The speaking rate.'),
  multiVoices: z.array(z.string()).optional().describe('List of voice IDs for combined mode.'),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

export const TextToSpeechOutputSchema = z.object({
  media: z.string().describe("The base64 encoded MP3 audio data URI."),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;
