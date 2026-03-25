
import { NextResponse } from 'next/server';
import { textToSpeechFlow } from '@/ai/flows/text-to-speech-flow';
import { TextToSpeechInputSchema } from '@/ai/flows/text-to-speech-types';

export const maxDuration = 60; // Ensure enough time for neural synthesis

export async function POST(req: Request) {
  try {
    const text = await req.text();
    if (!text) {
      return NextResponse.json({ error: 'Empty body' }, { status: 400 });
    }

    let body: any;
    try {
      body = JSON.parse(text);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const validatedInput = TextToSpeechInputSchema.parse(body);
    const result = await textToSpeechFlow(validatedInput);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('API /api/text-to-speech ERROR:', err);
    const message = err.message || 'An error occurred during text-to-speech conversion.';
    return NextResponse.json(
      { error: 'Internal Server Error', message },
      { status: 500 }
    );
  }
}
