import { NextResponse } from 'next/server';

/**
 * Proxy route for checking credit status via the Python backend.
 * Refactored to use the specific production backend as the primary fallback.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  // Priority: NEURAL_ENGINE_URL -> Production Link -> Localhost
  const baseUrl = process.env.NEURAL_ENGINE_URL || 
                  process.env.NEXT_PUBLIC_NEURAL_ENGINE_URL || 
                  "https://neural-engine-398550479414.us-central1.run.app";

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
    console.warn(`Neural Engine connectivity: ${error.message || 'Connection refused'}`);
    
    return NextResponse.json({ 
      error: "Neural Engine Offline", 
      credits: 0, 
      offline: true 
    }, { status: 200 });
  }
}
