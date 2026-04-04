import { NextResponse } from 'next/server';
import { generateStudioAnimation } from '@/ai/flows/studio-flow';

/**
 * Main Studio API route.
 * Orchestrates the animation generation through Genkit flows.
 * Updated maxDuration to 600s (10 minutes) to support professional cinematic renders.
 */
export const maxDuration = 600; 

export async function POST(req: Request) {
  try {
    const text = await req.text();
    if (!text) {
      return NextResponse.json({ error: "Empty request" }, { status: 400 });
    }

    let body;
    try {
      body = JSON.parse(text);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON input" }, { status: 400 });
    }
    
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
          ? "The animation is undergoing complex neural synthesis. Professional cinematic renders can take up to 10 minutes. Please check your library shortly." 
          : error.message 
      },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
