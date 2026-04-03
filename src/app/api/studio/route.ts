import { NextResponse } from 'next/server';
import { generateStudioAnimation } from '@/ai/flows/studio-flow';

export const maxDuration = 120; // 2 minute timeout for video generation

/**
 * Main Studio API route.
 * Orchestrates the animation generation through Genkit flows.
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
    
    // Check if it's a timeout error
    const isTimeout = error.message?.toLowerCase().includes('timeout') || error.message?.toLowerCase().includes('deadline');
    
    return NextResponse.json(
      { 
        error: "Neural Studio Error", 
        message: isTimeout ? "The animation is taking a long time. Please wait a few moments and check your history." : error.message 
      },
      { status: 500 }
    );
  }
}
