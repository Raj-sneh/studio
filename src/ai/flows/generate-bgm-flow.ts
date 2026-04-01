'use server';
/**
 * @fileOverview A neural BGM generator that "listens" to vocals and composes matching piano tracks.
 */

import { ai } from '@/ai/genkit';
import {
  GenerateBgmInputSchema,
  GenerateBgmOutputSchema,
  type GenerateBgmInput,
  type GenerateBgmOutput,
} from './generate-bgm-types';

/**
 * Generates a synchronized piano background for a vocal track.
 */
export async function generateBgm(input: GenerateBgmInput): Promise<GenerateBgmOutput> {
  try {
    return await generateBgmFlow(input);
  } catch (error: any) {
    console.error("BGM Generation Error:", error);
    throw new Error(`I couldn't compose the background: ${error.message || 'The neural engine is busy.'}`);
  }
}

const generateBgmFlow = ai.defineFlow(
  {
    name: 'generateBgmFlow',
    inputSchema: GenerateBgmInputSchema,
    outputSchema: GenerateBgmOutputSchema,
  },
  async (input) => {
    const { vocalAudioUri, mood } = input;

    // Use Gemini 2.5 Flash multimodal capabilities to "hear" the audio
    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      output: { schema: GenerateBgmOutputSchema },
      messages: [
        {
          role: 'user',
          content: [
            { text: `You are an expert accompanist. Listen to this vocal recording. 
            Analyze its rhythm, emotional tone, and key. 
            Compose a beautiful piano background track that complements it perfectly.
            
            RULES:
            1. Suggest a tempo (BPM) that matches the vocal speed.
            2. Generate a sequence of notes using Tone.js timing (e.g., '0:0:0') and durations ('4n').
            3. Ensure the BGM doesn't overpower the vocals.
            4. If a mood is provided ("${mood || 'none'}"), incorporate it.
            
            Return ONLY the JSON object.` },
            {
              media: {
                url: vocalAudioUri,
                contentType: 'audio/wav', // Assumed, Genkit/Gemini handles common formats
              },
            },
          ],
        },
      ],
    });

    const output = response.output;
    if (!output) throw new Error("The neural composer couldn't interpret the vocal rhythm. Try a clearer sample?");
    
    return output;
  }
);
