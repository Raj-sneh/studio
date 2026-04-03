
'use server';
/**
 * @fileOverview Sargam Studio AI Animation Flow.
 * Uses Google Veo models to generate 2D and 3D animations from text prompts.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const StudioInputSchema = z.object({
  prompt: z.string().describe('Description of the animation to generate.'),
  style: z.enum(['2d-animation', '3d-render', 'cinematic', 'anime', 'pixel-art']).default('3d-render'),
  aspectRatio: z.enum(['16:9', '9:16', '1:1']).default('16:9'),
});

export type StudioInput = z.infer<typeof StudioInputSchema>;

export const studioFlow = ai.defineFlow(
  {
    name: 'studioFlow',
    inputSchema: StudioInputSchema,
    outputSchema: z.object({
      videoUrl: z.string(),
      description: z.string(),
    }),
  },
  async (input) => {
    const fullPrompt = `A high-quality ${input.style} of: ${input.prompt}. Ensure smooth motion and professional lighting.`;

    // Initialize Video Generation Operation
    let { operation } = await ai.generate({
      model: googleAI.model('veo-3.0-generate-preview'),
      prompt: fullPrompt,
      config: {
        aspectRatio: input.aspectRatio as any,
      },
    });

    if (!operation) {
      throw new Error('Neural engine failed to initiate the rendering operation.');
    }

    // Polling logic for Long Running Operation (LRO)
    // Video generation typically takes 30-60 seconds.
    let attempts = 0;
    const maxAttempts = 24; // 2 minutes max (5s intervals)

    while (!operation.done && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      operation = await ai.checkOperation(operation);
      attempts++;
    }

    if (!operation.done) {
      throw new Error('The animation is taking longer than expected. Please try again or check history later.');
    }

    if (operation.error) {
      throw new Error(`Rendering failed: ${operation.error.message}`);
    }

    const videoPart = operation.output?.message?.content.find((p) => !!p.media);
    if (!videoPart || !videoPart.media?.url) {
      throw new Error('Neural engine completed but no video output was found.');
    }

    // Fetch the video and convert to Data URI for immediate client delivery
    // Note: In production, you would upload this to Firebase Storage.
    const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;
    const videoDownloadResponse = await fetch(`${videoPart.media.url}&key=${apiKey}`);
    
    if (!videoDownloadResponse.ok) {
      throw new Error('Failed to download the generated animation from the neural cloud.');
    }

    const buffer = await videoDownloadResponse.arrayBuffer();
    const base64Video = Buffer.from(buffer).toString('base64');

    return {
      videoUrl: `data:video/mp4;base64,${base64Video}`,
      description: `Neural ${input.style} render complete.`,
    };
  }
);

export async function generateStudioAnimation(input: StudioInput) {
  return studioFlow(input);
}
