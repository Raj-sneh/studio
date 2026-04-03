import { NextResponse } from 'next/server';
import { generateStudioAnimation } from '@/ai/flows/studio-flow';

export const maxDuration = 120; // 2 minute timeout for video generation (Max allowed)

/**
 * Main Studio API route.
 * Orchestrates the animation generation through Genkit flows.
 * Optimized for long-running neural video tasks.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const result = await generateStudioAnimation(body);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Studio API Error:", error);
    
    // Check if it's a timeout or platform-level deadline error
    const isTimeout = error.message?.toLowerCase().includes('timeout') || 
                      error.message?.toLowerCase().includes('deadline') ||
                      error.message?.toLowerCase().includes('taking longer');
    
    return NextResponse.json(
      { 
        error: "Neural Studio Error", 
        message: isTimeout 
          ? "The animation is taking a long time to render in the cloud. Please wait a few moments and check your library shortly." 
          : error.message 
      },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
