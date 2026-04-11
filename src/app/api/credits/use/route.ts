import { NextResponse } from 'next/server';

/**
 * Proxy route for deducting credits via the Python backend.
 * Standardizes backend URL resolution and handles connection refusal without crashing.
 */
export async function POST(req: Request) {
  try {
    const text = await req.text();
    if (!text) {
      return NextResponse.json({ error: "Empty request body" }, { status: 400 });
    }
    
    let body;
    try {
      body = JSON.parse(text);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON input" }, { status: 400 });
    }

    // Priority: NEURAL_ENGINE_URL -> NEXT_PUBLIC_NEURAL_ENGINE_URL -> Localhost
    const baseUrl = process.env.NEURAL_ENGINE_URL || process.env.NEXT_PUBLIC_NEURAL_ENGINE_URL || process.env.VOICE_ENGINE_URL || "http://localhost:8080";

    const response = await fetch(`${baseUrl}/api/credits/use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    });
    
    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    if (!response.ok) {
        const errorData = isJson ? await response.json().catch(() => ({})) : { error: "Neural Engine returned an error." };
        return NextResponse.json({ 
          error: errorData.error || "Credit System Connection Failed", 
          offline: true
        }, { status: 503 });
    }

    if (!isJson) {
      return NextResponse.json({ error: "Unexpected response from Neural Engine", offline: true }, { status: 503 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.warn(`Credit usage connectivity issue: ${error.message}`);
    return NextResponse.json(
      { error: "Neural Engine unreachable. Ensure the backend is running." }, 
      { status: 503 }
    );
  }
}
