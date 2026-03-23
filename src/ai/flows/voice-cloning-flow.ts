'use server';
/**
 * @fileOverview A stubbed flow for voice cloning as the external engine has been decommissioned.
 */

import { ai } from '@/ai/genkit';
import {
  VoiceCloningInputSchema,
  VoiceCloningOutputSchema,
  type VoiceCloningInput,
  type VoiceCloningOutput,
} from './voice-cloning-types';

export async function cloneVoice(input: VoiceCloningInput): Promise<VoiceCloningOutput> {
  return voiceCloningFlow(input);
}

const voiceCloningFlow = ai.defineFlow(
  {
    name: 'voiceCloningFlow',
    inputSchema: VoiceCloningInputSchema,
    outputSchema: VoiceCloningOutputSchema,
  },
  async (input) => {
    throw new Error("The high-fidelity voice cloning engine is currently undergoing a professional studio upgrade. Please check back later!");
  }
);
