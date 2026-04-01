import { NextResponse } from 'next/server';

/**
 * Proxy route for checking credit status via the Python backend.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  // Look for the server-side variable first, then the public one as backup
  const baseUrl = process.env.NEURAL_ENGINE_URL || process.env.NEXT_PUBLIC_NEURAL_ENGINE_URL || "http://localhost:8080";

  console.log("Server checking credits at:", baseUrl);

  try {
    const response = await fetch(`${baseUrl}/api/credits/status/${userId}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json({ error: errorText || "Status check failed." }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Credit check failed:", error);
    // Return a fallback so the app doesn't crash during sync
    return NextResponse.json({ 
      error: "Neural Engine Offline", 
      credits: 0,
      offline: true 
    }, { status: 200 });
  }
}