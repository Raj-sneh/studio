
import { askSargam } from '@/ai/flows/assistant-flow';
import {
  type AssistantInput,
} from '@/ai/flows/assistant-types';

export const maxDuration = 60; // Increase timeout for slow AI flows

export async function POST(req: Request) {
  try {
    const text = await req.text();
    if (!text) {
      return Response.json({ error: 'Request body is empty' }, { status: 400 });
    }

    let body: any;
    try {
      body = JSON.parse(text);
    } catch (e) {
      return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    if (!body.prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const input: AssistantInput = {
      prompt: body.prompt,
      history: body.history || [],
      userName: body.userName || undefined,
      userId: body.userId || undefined, // PASS UID TO ASSISTANT
      photoDataUri: body.photoDataUri || undefined,
    };

    const result = await askSargam(input);

    return Response.json(result);
  } catch (err: any) {
    console.error('API /api/ai ERROR:', err);
    return Response.json(
      { error: 'Internal Server Error', message: err.message },
      { status: 500 }
    );
  }
}
