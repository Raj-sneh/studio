import { ai } from "@/ai/genkit";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body?.prompt;

    if (!prompt || typeof prompt !== "string") {
      return Response.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const result = await ai.generate({
      model: "googleai/gemini-1.5-pro",
      prompt: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    return Response.json({
      text: result.text,
    });
  } catch (err: any) {
    console.error("GENKIT API ERROR:", err);
    return Response.json(
      { error: "Internal Server Error", message: err.message },
      { status: 500 }
    );
  }
}
