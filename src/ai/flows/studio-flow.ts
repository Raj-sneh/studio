'use server';
/**
 * @fileOverview Sargam Studio AI Animation Flow - Veo 3 Production Edition.
 * Upgraded to veo-3.0-generate-preview for sound support and higher quality.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const StudioInputSchema = z.object({
  prompt: z.string().describe('Initial concept or base description.'),
  style: z.enum(['2d-animation', '3d-render', 'cinematic', 'anime', 'pixel-art']).default('3d-render'),
  aspectRatio: z.enum(['16:9', '9:16', '1:1']).default('16:9'),
  instructions: z.array(z.string()).optional().describe('Iterative refinement instructions.'),
});

export type StudioInput = z.infer<typeof StudioInputSchema>;

export const studioFlow = ai.defineFlow(
  {
    name: 'studioFlow',
    inputSchema: StudioInputSchema,
    outputSchema: z.object({
      videoUrl: z.string(),
      description: z.string(),
      finalSynthesizedPrompt: z.string(),
    }),
  },
  async (input) => {
    const directorPrompt = `You are a cinematic director. Synthesize a detailed paragraph for a high-fidelity video model.
    
    BASE: "${input.prompt}"
    EVOLUTION: ${input.instructions?.length ? input.instructions.join(' -> ') : 'Initial shot.'}

    GOAL: Create a single, continuous narrative paragraph.
    RULES:
    - Persistence: Establish the exact environment from the BASE and keep it.
    - Sound Ready: Describe sounds clearly so the audio engine can generate them (e.g., "The sound of rushing wind and synth music...").
    - Style: ${input.style}.
    
    Return ONLY the paragraph.`;

    const { text: masterPrompt } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: directorPrompt,
    });

    const fullPrompt = `${masterPrompt}. Cinematic high-quality production.`;

    // Upgraded to Veo 3 for Sound Support
    let { operation } = await ai.generate({
      model: 'googleai/veo-3.0-generate-preview',
      prompt: fullPrompt,
      config: {
        aspectRatio: '16:9',
        personGeneration: 'allow_all', // Veo 3 default
      },
    });

    if (!operation) throw new Error('Neural engine failed to initiate rendering.');

    let attempts = 0;
    const maxAttempts = 150; 

    while (!operation.done && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      operation = await ai.checkOperation(operation);
      attempts++;
    }

    if (!operation.done) throw new Error('Neural synthesis timed out.');
    if (operation.error) throw new Error(`Rendering failed: ${operation.error.message}`);

    const videoPart = operation.output?.message?.content.find((p) => !!p.media);
    if (!videoPart || !videoPart.media?.url) throw new Error('No video output found.');

    const apiKey = process.env.GEMINI_API_KEY;
    const videoDownloadResponse = await fetch(`${videoPart.media.url}&key=${apiKey}`);
    
    if (!videoDownloadResponse.ok) throw new Error('Failed to download animation.');

    const buffer = await videoDownloadResponse.arrayBuffer();
    const base64Video = Buffer.from(buffer).toString('base64');

    return {
      videoUrl: `data:video/mp4;base64,${base64Video}`,
      description: `Narrative synthesized with sound.`,
      finalSynthesizedPrompt: masterPrompt,
    };
  }
);

export async function generateStudioAnimation(input: StudioInput) {
  return studioFlow(input);
}
