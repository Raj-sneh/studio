
import { NextResponse } from 'next/server';
import { generateStudioAnimation } from '@/ai/flows/studio-flow';

export const maxDuration = 120; // 2 minute timeout for video generation

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
    return NextResponse.json(
      { error: "Neural Studio Error", message: error.message },
      { status: 500 }
    );
  }
}
