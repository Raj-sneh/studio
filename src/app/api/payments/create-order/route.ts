import { NextResponse } from 'next/server';

/**
 * Proxy route for creating a Razorpay order via the Python backend.
 * Bypasses browser CORS and Mixed Content restrictions.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const response = await fetch('http://127.0.0.1:1000/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Proxy create-order error:", error);
    return NextResponse.json({ error: "Could not connect to the Neural Engine." }, { status: 500 });
  }
}
