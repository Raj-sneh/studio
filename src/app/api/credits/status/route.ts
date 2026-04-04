import { NextResponse } from 'next/server';

/**
 * Proxy route for checking credit status via the Python backend.
 * Refactored to handle ECONNREFUSED and other network errors gracefully.
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
      cache: 'no-store',
      signal: AbortSignal.timeout(5000) // 5s timeout to prevent hanging
    });
    
    const contentType = response.headers.get("content-type");
    if (!response.ok || !contentType || !contentType.includes("application/json")) {
        return NextResponse.json({ 
          status: "Offline",
          credits: 0,
          offline: true,
          message: "Neural Engine currently offline."
        }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    // Log minimal info to prevent server console spam
    console.warn(`Neural Engine connectivity: ${error.message || 'Connection refused'}`);
    
    return NextResponse.json({ 
      error: "Neural Engine Offline", 
      credits: 0,
      offline: true 
    }, { status: 200 });
  }
}
