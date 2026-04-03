import { NextResponse } from 'next/server';

/**
 * Proxy route for checking credit status via the Python backend.
 * Safely handles HTML error responses to prevent JSON parsing crashes.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const baseUrl = process.env.NEURAL_ENGINE_URL || process.env.NEXT_PUBLIC_NEURAL_ENGINE_URL || process.env.VOICE_ENGINE_URL || "http://localhost:8080";

  try {
    const response = await fetch(`${baseUrl}/api/credits/status/${userId}`, {
      cache: 'no-store'
    });
    
    const contentType = response.headers.get("content-type");
    if (!response.ok || !contentType || !contentType.includes("application/json")) {
        const text = await response.text().catch(() => "Unknown error");
        return NextResponse.json({ 
          error: "Neural Engine Status Check Failed", 
          details: text.substring(0, 100),
          status: response.status 
        }, { status: response.status === 200 ? 503 : response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Credit check failed:", error);
    return NextResponse.json({ 
      error: "Neural Engine Offline", 
      credits: 0,
      offline: true 
    }, { status: 200 }); // Return fallback so app doesn't crash
  }
}
