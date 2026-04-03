import { NextResponse } from 'next/server';

/**
 * Proxy route for deducting credits via the Python backend.
 * Standardizes backend URL resolution and handles non-JSON error pages.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const baseUrl = process.env.NEURAL_ENGINE_URL || process.env.NEXT_PUBLIC_NEURAL_ENGINE_URL || process.env.VOICE_ENGINE_URL || "http://localhost:8080";

    const response = await fetch(`${baseUrl}/api/credits/use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });
    
    const contentType = response.headers.get("content-type");
    if (!response.ok || !contentType || !contentType.includes("application/json")) {
        const text = await response.text().catch(() => "Unknown error");
        return NextResponse.json({ 
          error: "Credit System Connection Failed", 
          details: text.substring(0, 100) 
        }, { status: response.status === 200 ? 503 : response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Proxy use-credits fetch failed:", error);
    return NextResponse.json(
      { error: "Neural Engine unreachable. Ensure the Python server is running." }, 
      { status: 503 }
    );
  }
}
