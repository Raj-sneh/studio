'use server';
/**
 * @fileOverview Sargam Studio AI Animation Flow - Production Stability Edition.
 * Reverted to veo-2.0-generate-001 to resolve 404 API errors while maintaining high quality.
 * Added safety instructions to avoid "third-party content provider" blocks.
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
    // Style-specific guidance for the director
    const styleGuides: Record<string, string> = {
      '2d-animation': 'Extremely cartoonistic, bold outlines, vibrant flat colors, exaggerated character expressions and squash-and-stretch motion.',
      '3d-render': 'Hyper-realistic 3D CGI, soft global illumination, detailed textures, Pixar-like quality.',
      'cinematic': 'Live-action film aesthetic, shallow depth of field, natural lighting, professional cinematography.',
      'anime': 'Modern high-action anime style, dynamic line work, dramatic lighting, hand-drawn aesthetic.',
      'pixel-art': 'Retro 16-bit pixel art, vibrant color palette, limited resolution, nostalgic gaming aesthetic.'
    };

    const specificStyleGuide = styleGuides[input.style] || input.style;

    const directorPrompt = `You are a cinematic director. Synthesize a detailed paragraph for a high-fidelity video model.
    
    BASE: "${input.prompt}"
    EVOLUTION: ${input.instructions?.length ? input.instructions.join(' -> ') : 'Initial shot.'}

    GOAL: Create a single, continuous narrative paragraph that describes the scene visually and dynamically.
    RULES:
    - Persistence: Establish the exact environment from the BASE and keep it consistent.
    - Motion: Describe camera movements and character actions clearly.
    - Style: ${specificStyleGuide}.
    - Safety: ABSOLUTELY NO real-world celebrities, public figures, trademarked brands, or copyrighted characters (e.g. no Mickey Mouse, no superheroes from comics, no specific logos). If the user mentions them, substitute with generic, original descriptions that capture the vibe.
    
    Return ONLY the synthesized paragraph.`;

    const { text: masterPrompt } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: directorPrompt,
      config: {
        safetySettings: [
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        ],
      }
    });

    const fullPrompt = `${masterPrompt}. High-quality visual production.`;

    // Using Veo 2.0 for API stability
    let { operation } = await ai.generate({
      model: 'googleai/veo-2.0-generate-001',
      prompt: fullPrompt,
      config: {
        durationSeconds: 5,
        aspectRatio: '16:9',
        personGeneration: 'allow_adult',
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
    if (operation.error) {
      // Catch specific "third party" errors
      if (operation.error.message?.toLowerCase().includes('third-party') || operation.error.message?.toLowerCase().includes('interest')) {
         throw new Error("Neural Safety Block: The prompt contained copyrighted concepts. Please use generic descriptions (e.g. 'a hero in a suit' instead of 'Spider-Man').");
      }
      throw new Error(`Rendering failed: ${operation.error.message}`);
    }

    const videoPart = operation.output?.message?.content.find((p) => !!p.media);
    if (!videoPart || !videoPart.media?.url) throw new Error('No video output found.');

    const apiKey = process.env.GEMINI_API_KEY;
    const videoDownloadResponse = await fetch(`${videoPart.media.url}&key=${apiKey}`);
    
    if (!videoDownloadResponse.ok) throw new Error('Failed to download animation.');

    const buffer = await videoDownloadResponse.arrayBuffer();
    const base64Video = Buffer.from(buffer).toString('base64');

    return {
      videoUrl: `data:video/mp4;base64,${base64Video}`,
      description: `Narrative synthesized with ${input.style} protocol.`,
      finalSynthesizedPrompt: masterPrompt,
    };
  }
);

export async function generateStudioAnimation(input: StudioInput) {
  return studioFlow(input);
}
