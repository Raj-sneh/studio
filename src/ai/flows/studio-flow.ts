'use server';
/**
 * @fileOverview Sargam Studio AI Animation Flow - Prototype Animator Edition.
 * Uses a "Director" LLM to synthesize iterative user modifications before 
 * rendering with Google Veo 2.0.
 * Updated to support extended render windows for high-fidelity cinematic output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const StudioInputSchema = z.object({
  prompt: z.string().describe('Initial concept or base description.'),
  style: z.enum(['2d-animation', '3d-render', 'cinematic', 'anime', 'pixel-art']).default('3d-render'),
  aspectRatio: z.enum(['16:9', '9:16', '1:1']).default('16:9'),
  instructions: z.array(z.string()).optional().describe('Iterative refinement instructions from the user.'),
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
    // 1. The Director Layer: Synthesize iterative feedback into a single high-fidelity prompt
    const directorPrompt = `You are a cinematic AI director for the Sargam Studio Prototype Animator.
    
    BASE CONCEPT: "${input.prompt}"
    USER STYLE: "${input.style}"
    REFINEMENT LOG: ${input.instructions?.length ? input.instructions.join(' -> ') : 'Initial state only.'}

    YOUR GOAL: Synthesize these into a single paragraph for a video generation model.
    
    TEMPORAL PROGRESSION RULES:
    - If the instructions imply a sequence (e.g., "then", "after a while", "eventually"), you MUST describe the progression of motion.
    - Start the description by establishing the base concept (e.g., "A duck swimming peacefully...").
    - Then transition the description into the new action (e.g., "...and then, after a moment of swimming, the duck suddenly dives and emerges with a fish in its mouth.").
    - Describe the change over time to ensure a fluid narrative within the clip.
    
    VISUAL RULES:
    - Focus on fluid motion, consistent characters, and high-fidelity lighting.
    - Describe the visual style based on the protocol: ${input.style}.
    - Focus on materials and textures (e.g. rounded 3D forms, hand-drawn lines).
    
    Return ONLY the final descriptive narrative paragraph.`;

    const { text: masterPrompt } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: directorPrompt,
    });

    const stylePrompts: Record<string, string> = {
      '3d-render': 'high-quality stylized 3D CGI feature film animation, vibrant saturated colors, soft rounded surfaces, studio lighting, smooth character physics',
      '2d-animation': 'traditional 2D hand-drawn flipbook animation, pencil sketch aesthetic, fluid organic motion, expressive line art, textured background',
      'cinematic': 'hyper-realistic cinematic live-action footage, 8k resolution, professional film lighting, wide-angle lens, realistic physics',
      'anime': 'modern high-budget action shonen anime style, sharp line art, dynamic cinematic shading, intense motion blur effects',
      'pixel-art': 'detailed 32-bit pixel art animation, vibrant palette, smooth frame-by-frame sprite motion'
    };

    const styleInstruction = stylePrompts[input.style] || stylePrompts['3d-render'];
    const fullPrompt = `${masterPrompt}. Style: ${styleInstruction}. The motion must be smooth, logical, and show a clear progression of events as described.`;

    // 2. The Render Layer: Call Veo 2.0 with optimized duration
    let { operation } = await ai.generate({
      model: 'googleai/veo-2.0-generate-001',
      prompt: fullPrompt,
      config: {
        aspectRatio: input.aspectRatio as any,
        durationSeconds: 8, // Using the max supported duration for high-fidelity clips
        personGeneration: 'allow_all',
      },
    });

    if (!operation) {
      throw new Error('Neural engine failed to initiate the rendering operation.');
    }

    let attempts = 0;
    // Increased to 120 attempts (10 minutes) to support the user's requested capacity
    const maxAttempts = 120; 

    while (!operation.done && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      operation = await ai.checkOperation(operation);
      attempts++;
    }

    if (!operation.done) {
      throw new Error('Neural processing is taking longer than expected. High-fidelity cinematic animations can take up to 10 minutes to render in the cloud.');
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
      description: `Neural render complete. The sequence follows your iterative refinements with narrative flow.`,
      finalSynthesizedPrompt: masterPrompt,
    };
  }
);

export async function generateStudioAnimation(input: StudioInput) {
  return studioFlow(input);
}
