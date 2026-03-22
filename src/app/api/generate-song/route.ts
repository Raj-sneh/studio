import { NextResponse } from 'next/server';
import { generateSong } from '@/ai/flows/lyrics-to-music-flow';
import { GenerateSongInputSchema } from '@/ai/flows/lyrics-to-music-types';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const text = await req.text();
    if (!text) {
      return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
    }

    let body: any;
    try {
      body = JSON.parse(text);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    
    const validatedInput = GenerateSongInputSchema.parse(body);
    const result = await generateSong(validatedInput);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('API /api/generate-song ERROR:', err);
    
    // Provide a more descriptive error message to the client
    const message = err.message || 'I had a problem making your song. Please try again.';
    
    return NextResponse.json(
      { error: 'Internal Server Error', message },
      { status: 500 }
    );
  }
}
