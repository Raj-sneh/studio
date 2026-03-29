
import { NextResponse } from 'next/server';

/**
 * Proxy route for checking credit status via the Python backend.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const baseUrl = process.env.NEURAL_ENGINE_URL || "http://localhost:8080";

    const response = await fetch(`${baseUrl}/api/credits/status/${userId}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json({ error: errorText || "Status check failed." }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Proxy status error:", error);
    return NextResponse.json({ error: `Status sync failed: ${error.message}` }, { status: 500 });
  }
}
