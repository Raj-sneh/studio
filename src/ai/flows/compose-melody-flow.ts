
'use server';
/**
 * @fileOverview A flow for composing melodies using a generative AI model.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import Replicate from 'replicate';
import type { Note } from '@/types';

// Initialize Replicate with the API token from environment variables
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const ComposeMelodyInputSchema = z.string();
const ComposeMelodyOutputSchema = z.array(
  z.object({
    key: z.union([z.string(), z.array(z.string())]),
    duration: z.string(),
    time: z.string(),
  })
);

export async function composeMelodyFlow(
  prompt: z.infer<typeof ComposeMelodyInputSchema>
): Promise<z.infer<typeof ComposeMelodyOutputSchema>> {
  return composeMelodyReplicateFlow(prompt);
}

/**
 * A simple regex-based parser to convert MusicGen's output to Note objects.
 * This is a simplified implementation and may not cover all cases.
 * Example input: "C4/q, G4/q, A4/h"
 */
function parseMelodyString(melodyStr: string): Note[] {
    const noteMap: { [key: string]: string } = {
        'q': '4n', // quarter note
        'h': '2n', // half note
        'w': '1n', // whole note
        'e': '8n', // eighth note
        's': '16n', // sixteenth note
    };

    const notes: Note[] = [];
    let currentTime = 0;
    const tempo = 120; // Assume a default tempo
    const quarterNoteDuration = 60 / tempo;

    const noteParts = melodyStr.split(/, */);

    noteParts.forEach(part => {
        const [pitch, durationAbbr] = part.split('/');
        if (pitch && durationAbbr) {
            const duration = noteMap[durationAbbr.trim()] || '4n';
            notes.push({
                key: pitch.trim(),
                duration: duration,
                time: `0:${Math.floor(currentTime / 4)}:${currentTime % 4}`,
            });

            // Increment time based on duration
            switch(duration) {
                case '1n': currentTime += 4; break;
                case '2n': currentTime += 2; break;
                case '4n': currentTime += 1; break;
                case '8n': currentTime += 0.5; break;
                case '16n': currentTime += 0.25; break;
            }
        }
    });

    return notes;
}


const composeMelodyReplicateFlow = ai.defineFlow(
  {
    name: 'composeMelodyReplicateFlow',
    inputSchema: ComposeMelodyInputSchema,
    outputSchema: ComposeMelodyOutputSchema,
  },
  async (prompt) => {
    // This flow will call the Replicate API directly
    // This is a placeholder for a real implementation that might use a music generation model
    try {
        const output = await replicate.run(
          "meta/musicgen:b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38",
          {
            input: {
              top_k: 250,
              top_p: 0,
              prompt: prompt,
              duration: 5,
              temperature: 1,
              continuation: false,
              model_version: "melody-large",
              output_format: "mp3", // Even if we want notes, some models require a format.
              continuation_start: 0,
              multi_band_diffusion: false,
              normalization_strategy: "peak",
              classifier_free_guidance: 3
            }
          }
        );
        
        // IMPORTANT: The 'musicgen' model on Replicate produces an audio file, not a sequence of notes.
        // For a real application, you would need a model that outputs MIDI, ABC notation, or a similar structured format.
        // Since we get an audio URL, we can't directly create the note structure.
        // As a fallback, we will return a pre-defined melody.
        // In a real-world scenario, one would use a model like "lucidrains/musiclm-pytorch" or similar
        // configured to output symbolic music representations.

        console.log("Replicate output:", output);
        
        // Placeholder melody because the model returns audio, not notes.
        const placeholderMelody: Note[] = [
            { key: 'C4', duration: '8n', time: '0:0:0' },
            { key: 'D4', duration: '8n', time: '0:0:2' },
            { key: 'E4', duration: '4n', time: '0:1:0' },
            { key: 'C4', duration: '4n', time: '0:2:0' },
            { key: 'E4', duration: '4n', time: '0:3:0' },
            { key: 'F4', duration: '2n', time: '1:0:0' },
        ];

        return placeholderMelody;

    } catch (error) {
        console.error("Error calling Replicate API:", error);
        throw new Error("Failed to generate melody from Replicate.");
    }
  }
);

    