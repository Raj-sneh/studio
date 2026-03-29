
import { NextResponse } from 'next/server';

/**
 * Proxy route for deducting credits via the Python backend on localhost:8080.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const response = await fetch('http://localhost:8080/credits/use', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json({ error: errorData.error || "Credit deduction failed." }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Proxy use-credits error:", error);
    return NextResponse.json({ error: `Credit system offline: ${error.message}` }, { status: 500 });
  }
}
