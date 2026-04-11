import { NextResponse } from 'next/server';
import { generateStudioAnimation } from '@/ai/flows/studio-flow';

/**
 * Main Studio API route.
 * Upgraded maxDuration to 600s (10 minutes) for Veo 3 production renders.
 */
export const maxDuration = 600; 

export async function POST(req: Request) {
  try {
    const text = await req.text();
    if (!text) return NextResponse.json({ error: "Empty request" }, { status: 400 });

    let body;
    try {
      body = JSON.parse(text);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    
    if (!body.prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

    const result = await generateStudioAnimation(body);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Studio API Error:", error);
    const isTimeout = error.message?.toLowerCase().includes('timeout') || error.message?.toLowerCase().includes('deadline');
    return NextResponse.json(
      { error: "Neural Error", message: isTimeout ? "The render is taking longer than expected. Complex sequences can take up to 10 minutes." : error.message },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
