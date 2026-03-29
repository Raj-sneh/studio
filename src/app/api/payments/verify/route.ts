
import { NextResponse } from 'next/server';

/**
 * Proxy route for verifying a Razorpay payment via the Python backend.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const response = await fetch('http://127.0.0.1:8080/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json({ error: errorData.error || "Verification failed." }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Proxy verify error:", error);
    return NextResponse.json({ error: `Verification failed: ${error.message}` }, { status: 500 });
  }
}
