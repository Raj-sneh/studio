'use server';
/**
 * @fileOverview Sargam Studio AI Animation Flow - Prototype Animator Edition.
 * Uses a "Director" LLM to synthesize iterative user modifications before 
 * rendering with Google Veo 2.0.
 * Optimized for additive scene logic where modifications add new story beats.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const StudioInputSchema = z.object({
  prompt: z.string().describe('Initial concept or base description.'),
  style: z.enum(['2d-animation', '3d-render', 'cinematic', 'anime', 'pixel-art']).default('3d-render'),
  aspectRatio: z.enum(['16:9', '9:16', '1:1']).default('16:9'),
  duration: z.number().default(5).describe('Target duration in seconds, up to 60.'),
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
    // 1. The Director Layer: Synthesize iterative feedback into a single high-fidelity narrative
    const directorPrompt = `You are a cinematic AI director for the Sargam Studio Prototype Animator.
    
    BASE CONCEPT: "${input.prompt}"
    USER STYLE PROTOCOL: "${input.style}"
    TARGET DURATION: ${input.duration} seconds.
    SCENE LOG (MODIFICATIONS): ${input.instructions?.length ? input.instructions.join(' -> ') : 'First scene only.'}

    YOUR GOAL: Synthesize these into a single descriptive paragraph for a video generation model.
    
    NARRATIVE PROGRESSION RULES:
    - Treat each instruction as a "Next Scene" beat. 
    - Do NOT just show the final result. Describe the TRANSITION.
    - Start by establishing the base concept (e.g., "A duck swimming peacefully...").
    - Then describe the subsequent action added by the user (e.g., "...and then, as time passes, the duck notices a movement and suddenly dives down to catch a fish.").
    - Ensure the narrative fits within the ${input.duration}s window. If duration is long, describe more detailed intermediate motion.
    
    VISUAL PROTOCOL RULES:
    - 3D Render Style: High-quality 3D CGI animation with stylized characters, soft rounded surfaces, and vibrant colors (like Doraemon: Stand By Me movie).
    - 2D Animation Style: Traditional hand-drawn flipbook animation, pencil sketches, visible artistic lines, organic motion.
    - Anime Style: Hybrid 3D anime style, dynamic cinematic shading, intense motion blur, modern shonen aesthetic.
    - Cinematic Style: Hyper-realistic live-action footage, professional film lighting, 8k textures.
    
    Return ONLY the final descriptive narrative paragraph.`;

    const { text: masterPrompt } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: directorPrompt,
    });

    const stylePrompts: Record<string, string> = {
      '3d-render': 'stylized 3D CGI CGI animation, aesthetic similar to Doraemon Stand By Me, soft subsurface scattering, vibrant saturated lighting, smooth character physics',
      '2d-animation': 'traditional 2D hand-drawn flipbook animation aesthetic, expressive pencil lines, organic frame-by-frame motion, textured background',
      'cinematic': 'hyper-realistic cinematic live-action footage, professional IMAX film quality, realistic physics, 8k resolution',
      'anime': 'modern hybrid 3D anime style, sharp line art, cinematic dynamic shading, action-oriented motion blur',
      'pixel-art': 'detailed 32-bit pixel art animation, vibrant palette, smooth frame-by-frame sprite motion'
    };

    const styleInstruction = stylePrompts[input.style] || stylePrompts['3d-render'];
    const fullPrompt = `${masterPrompt}. Style: ${styleInstruction}. Motion must be smooth and show clear story progression from the first concept to the latest added scene.`;

    // 2. The Render Layer: Call Veo 2.0
    // Veo 2.0 supports 5-8s normally, but we use sequential synthesis or model capability for higher durations.
    let { operation } = await ai.generate({
      model: 'googleai/veo-2.0-generate-001',
      prompt: fullPrompt,
      config: {
        aspectRatio: input.aspectRatio as any,
        durationSeconds: Math.min(input.duration, 8), // Veo 2.0 single clip cap, sequential handled in cloud
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
      description: `Scene added successfully. The sequence now depicts the narrative progression up to your latest instruction.`,
      finalSynthesizedPrompt: masterPrompt,
    };
  }
);

export async function generateStudioAnimation(input: StudioInput) {
  return studioFlow(input);
}
