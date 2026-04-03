'use server';
/**
 * @fileOverview Sargam Studio AI Animation Flow.
 * Uses Google Veo 2.0 models with expert prompt engineering for style accuracy.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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
    // Advanced Style Protocols for "Realistic Trained AI" results
    const stylePrompts: Record<string, string> = {
      '3d-render': 'a high-fidelity 3D digital render with ray-traced lighting, octane render style, extremely detailed textures, and cinematic depth of field',
      '2d-animation': 'a professional 2D hand-drawn animation style, cel-shaded, fluid motion, high-quality line art, reminiscent of modern high-budget animation studios',
      'cinematic': 'a hyper-realistic cinematic live-action shot, 8k resolution, photorealistic, professional film lighting, wide-angle lens, shot on IMAX',
      'anime': 'a high-budget modern anime style, dynamic lighting, expressive character motion, and vibrant atmospheric effects with sharp cinematic focus',
      'pixel-art': 'high-quality detailed pixel art animation, 32-bit aesthetic, smooth frame-by-frame motion, vibrant palette'
    };

    const styleInstruction = stylePrompts[input.style] || stylePrompts['3d-render'];
    const fullPrompt = `Generate an animation of: ${input.prompt}. Style: ${styleInstruction}. The motion must be smooth, logical, and consistent. The lighting and atmosphere should be professional and immersive. Ensure the output looks like a masterfully rendered neural masterpiece.`;

    // Use string identifier for model resolution safety
    let { operation } = await ai.generate({
      model: 'googleai/veo-2.0-generate-001',
      prompt: fullPrompt,
      config: {
        aspectRatio: input.aspectRatio as any,
        durationSeconds: 5,
        personGeneration: 'allow_adult',
      },
    });

    if (!operation) {
      throw new Error('Neural engine failed to initiate the rendering operation.');
    }

    let attempts = 0;
    const maxAttempts = 24; // 2 minutes max (5s intervals)

    while (!operation.done && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      operation = await ai.checkOperation(operation);
      attempts++;
    }

    if (!operation.done) {
      throw new Error('The animation is taking longer than expected. Please check your history in a few minutes.');
    }

    if (operation.error) {
      throw new Error(`Rendering failed: ${operation.error.message}`);
    }

    const videoPart = operation.output?.message?.content.find((p) => !!p.media);
    if (!videoPart || !videoPart.media?.url) {
      throw new Error('Neural engine completed but no video output was found.');
    }

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
