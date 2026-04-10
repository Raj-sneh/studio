'use server';
/**
 * @fileOverview Sargam Studio AI Animation Flow - Stable Cinematic Edition.
 * Uses a "Director" LLM to synthesize iterative user modifications with a focus
 * on mandatory visual persistence and narrative continuity.
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
    // 1. The Director Layer: Use Mandatory Environment Anchoring to prevent scene loss
    const directorPrompt = `You are a cinematic AI director for Sargam Studio. 
    You are synthesizing a detailed script for a high-fidelity video generation model.
    
    BASE CONCEPT (The Unchangeable Foundation): "${input.prompt}"
    STYLE PROTOCOL: "${input.style}"
    SCENE PROGRESSION (The Evolution): ${input.instructions?.length ? input.instructions.join(' -> ') : 'Initial shot.'}

    YOUR GOAL: Create a single, highly descriptive paragraph that describes a CONTINUOUS NARRATIVE.
    
    CRITICAL RULES FOR VISUAL PERSISTENCE:
    - MANDATORY ANCHORING: The video MUST establish the exact environment and characters from the BASE CONCEPT.
    - NARRATIVE CONTINUITY: Do NOT replace the initial scene. Simply add the next action.
    - DESCRIBE TRANSITIONS: Use phrases like "As the camera continues to follow [character] in the same setting..."
    - PERSISTENT ELEMENTS: Characters, colors, and the environment from the base concept MUST persist throughout the evolution.
    
    STYLE GUIDELINES (Purely Descriptive):
    - 3D Render: Stylized 3D CGI animation, soft subsurface scattering, vibrant lighting, smooth physics (Modern high-end CGI look).
    - 2D Animation: High-quality professional 2D digital cartoon animation, clean line art, vibrant flat colors, fluid traditional motion.
    - Anime: Modern hybrid 3D anime style, sharp line art, cinematic shading, action motion blur.
    - Cinematic: Hyper-realistic cinematic footage, professional IMAX quality, 8k resolution.

    SAFETY: Use purely descriptive terms. DO NOT mention copyrighted names, studios, or specific character brands.
    
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
    const fullPrompt = `${masterPrompt}. Style: ${styleInstruction}. The video must show absolute environment persistence from start to end.`;

    // 2. The Render Layer: Call Veo 2.0 (Stable & Supported)
    let { operation } = await ai.generate({
      model: 'googleai/veo-2.0-generate-001',
      prompt: fullPrompt,
      config: {
        durationSeconds: 8, 
        aspectRatio: input.aspectRatio === '1:1' ? '16:9' : input.aspectRatio as any,
        personGeneration: 'allow_adult',
      },
    });

    if (!operation) {
      throw new Error('Neural engine failed to initiate the rendering operation.');
    }

    let attempts = 0;
    const maxAttempts = 120; 

    while (!operation.done && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      operation = await ai.checkOperation(operation);
      attempts++;
    }

    if (!operation.done) {
      throw new Error('Neural synthesis is taking longer than expected. Complex cinematic sequences can take up to 10 minutes to finalize.');
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
      description: `Narrative synthesized. Continuity Protocol Active.`,
      finalSynthesizedPrompt: masterPrompt,
    };
  }
);

export async function generateStudioAnimation(input: StudioInput) {
  return studioFlow(input);
}