'use server';
/**
 * @fileOverview Sargam Studio AI Animation Flow - Prototype Animator Edition.
 * Uses a "Director" LLM to synthesize iterative user modifications before 
 * rendering with Google Veo 2.0.
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
    const directorPrompt = `You are a cinematic AI director. 
    Base Concept: "${input.prompt}"
    User Style: "${input.style}"
    Iterative Refinement Instructions: ${input.instructions?.length ? input.instructions.join(' -> ') : 'None'}

    Your task is to synthesize these into a single, highly descriptive cinematic prompt for a video generation model.
    Focus on motion, lighting, and consistency. Do NOT name specific copyrighted characters like Doraemon or Naruto unless the user explicitly requested them in the prompt.
    Describe visual styles instead (e.g., '3D stylized CGI' or 'Traditional hand-drawn 2D').
    
    Return ONLY the final descriptive paragraph.`;

    const { text: masterPrompt } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: directorPrompt,
    });

    const stylePrompts: Record<string, string> = {
      '3d-render': 'high-quality stylized 3D CGI animation, vibrant surfaces, soft studio lighting, rounded character forms, smooth physics',
      '2d-animation': 'traditional hand-drawn 2D pencil sketch animation, expressive line art, rough textured paper background, fluid motion',
      'cinematic': 'hyper-realistic cinematic live-action shot, 8k resolution, professional film lighting, wide-angle lens',
      'anime': 'modern high-budget action anime style, sharp line art, dynamic cel-shading, cinematic shonen aesthetic',
      'pixel-art': 'detailed pixel art animation, 32-bit aesthetic, smooth frame-by-frame motion'
    };

    const styleInstruction = stylePrompts[input.style] || stylePrompts['3d-render'];
    const fullPrompt = `${masterPrompt}. Visual Style: ${styleInstruction}. The motion must be smooth and logical.`;

    // 2. The Render Layer: Call Veo 2.0
    let { operation } = await ai.generate({
      model: 'googleai/veo-2.0-generate-001',
      prompt: fullPrompt,
      config: {
        aspectRatio: input.aspectRatio as any,
        durationSeconds: 5,
        personGeneration: 'allow_all',
      },
    });

    if (!operation) {
      throw new Error('Neural engine failed to initiate the rendering operation.');
    }

    let attempts = 0;
    const maxAttempts = 22; // ~110s

    while (!operation.done && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      operation = await ai.checkOperation(operation);
      attempts++;
    }

    if (!operation.done) {
      throw new Error('Taking Longer Than Expected: The animation is being processed in the cloud. It will be ready in 1-2 minutes.');
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
      description: `Neural render complete based on your iterative refinements.`,
      finalSynthesizedPrompt: masterPrompt,
    };
  }
);

export async function generateStudioAnimation(input: StudioInput) {
  return studioFlow(input);
}
