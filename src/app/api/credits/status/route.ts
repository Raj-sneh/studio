
import { NextResponse } from 'next/server';

/**
 * Proxy route for checking credit status and triggering daily resets.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const response = await fetch(`http://localhost:8081/credits/status/${userId}`, {
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
