'use server';
/**
 * @fileOverview Sargam Studio AI Animation Flow - Veo 3.0 Cinematic Edition.
 * Uses a "Director" LLM to synthesize iterative user modifications with a focus
 * on visual persistence and chronological continuity.
 * Rendered using the latest Google Veo 3.0 Preview model.
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
    // 1. The Director Layer: Use Chronological Anchoring to prevent scene loss
    const directorPrompt = `You are a cinematic AI director for Sargam Studio. 
    You are synthesizing a script for a high-fidelity video generation model.
    
    BASE CONCEPT (The Foundation): "${input.prompt}"
    STYLE PROTOCOL: "${input.style}"
    SCENE CHRONOLOGY (The Evolution): ${input.instructions?.length ? input.instructions.join(' -> ') : 'Initial shot.'}

    YOUR GOAL: Create a single, highly descriptive paragraph that describes a CONTINUOUS NARRATIVE.
    
    CRITICAL RULES FOR VISUAL PERSISTENCE:
    - The video MUST start by establishing the environment and characters from the BASE CONCEPT.
    - Each beat in the SCENE CHRONOLOGY must occur AFTER the previous one within the SAME environment.
    - Ensure the characters and core setting from the base concept PERSIST throughout the entire video.
    - Describe the TRANSITION and the flow of time (e.g., "Then, while still in the pond, the duck...")
    
    STYLE GUIDELINES:
    - 3D Render: Stylized 3D CGI animation, soft subsurface scattering, vibrant saturated lighting, smooth character physics (Doraemon Stand By Me style).
    - 2D Animation: High-quality professional 2D digital cartoon animation, clean line art, vibrant flat colors, fluid traditional motion, solid fills.
    - Anime: Modern hybrid 3D anime style, sharp line art, cinematic dynamic shading, intense motion blur.
    - Cinematic: Hyper-realistic cinematic live-action footage, professional IMAX quality, 8k resolution.

    SAFETY: Use purely descriptive terms. DO NOT mention copyrighted names or brands.
    
    Return ONLY the final descriptive paragraph.`;

    const { text: masterPrompt } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: directorPrompt,
    });

    const stylePrompts: Record<string, string> = {
      '3d-render': 'stylized 3D CGI animation, soft subsurface scattering, vibrant saturated lighting, smooth character physics, professional 3D rendering',
      '2d-animation': 'high-quality 2D digital cartoon animation, clean line art, vibrant flat colors, fluid traditional motion, solid fills, professional animation',
      'cinematic': 'hyper-realistic cinematic live-action footage, professional film lighting, realistic textures, 8k resolution',
      'anime': 'modern hybrid 3D anime style, sharp line art, cinematic dynamic shading, action-oriented motion blur',
      'pixel-art': 'detailed 32-bit pixel art animation, vibrant palette, smooth frame-by-frame sprite motion'
    };

    const styleInstruction = stylePrompts[input.style] || stylePrompts['3d-render'];
    const fullPrompt = `${masterPrompt}. Style: ${styleInstruction}. The video must show clear narrative continuity from the start to the end.`;

    // 2. The Render Layer: Call Veo 3.0 Preview
    // Veo 3.0 manages duration automatically (default 8s) and supports sound.
    let { operation } = await ai.generate({
      model: 'googleai/veo-3.0-generate-preview',
      prompt: fullPrompt,
      config: {
        aspectRatio: input.aspectRatio === '1:1' ? '16:9' : input.aspectRatio as any, // 1:1 fallback to 16:9 if needed
        personGeneration: 'allow_all',
      },
    });

    if (!operation) {
      throw new Error('Neural engine failed to initiate the rendering operation.');
    }

    let attempts = 0;
    const maxAttempts = 120; // 10 minutes total

    while (!operation.done && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      operation = await ai.checkOperation(operation);
      attempts++;
    }

    if (!operation.done) {
      throw new Error('Neural synthesis is taking longer than expected. Complex cinematic sequences can take up to 10 minutes to finalize.');
    }

    if (operation.error) {
      if (operation.error.message?.toLowerCase().includes('third-party') || operation.error.message?.toLowerCase().includes('content provider')) {
        throw new Error("The description contains terms restricted by content providers. Please use more generic descriptions and avoid character names.");
      }
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
      description: `Narrative synthesized. The animation now depicts the chronological evolution from your base concept to the latest added scene.`,
      finalSynthesizedPrompt: masterPrompt,
    };
  }
);

export async function generateStudioAnimation(input: StudioInput) {
  return studioFlow(input);
}
