import { NextResponse } from 'next/server';

/**
 * Proxy route for deducting credits via the Python backend.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const response = await fetch('http://127.0.0.1:8081/credits/use', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Proxy use-credits error:", error);
    return NextResponse.json({ error: "Credit system offline." }, { status: 500 });
  }
}
