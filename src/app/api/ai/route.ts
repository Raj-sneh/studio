import { askSargam } from '@/ai/flows/assistant-flow';
import {
  type AssistantInput,
} from '@/ai/flows/assistant-types';

export const maxDuration = 60; // Increase timeout for slow AI flows

export async function POST(req: Request) {
  try {
    const body: any = await req.json();

    if (!body.prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const input: AssistantInput = {
      prompt: body.prompt,
      history: body.history || [],
      userName: body.userName || undefined,
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
