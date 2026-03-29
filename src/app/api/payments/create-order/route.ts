import { NextResponse } from 'next/server';

/**
 * Proxy route for creating a Razorpay order via the Python backend.
 * Bypasses browser CORS and Mixed Content restrictions.
 * Now targets Port 8081 to avoid local privileged port restrictions.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const response = await fetch('http://127.0.0.1:8081/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json({ error: errorText || "Backend order creation failed." }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Proxy create-order error:", error);
    return NextResponse.json({ error: "Could not connect to the Neural Engine." }, { status: 500 });
  }
}
