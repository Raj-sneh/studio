
import { NextResponse } from 'next/server';

/**
 * Proxy route for creating a Razorpay order via the Python backend.
 * Bypasses browser CORS and Mixed Content restrictions.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Using localhost:8081 for reliable internal loopback communication
    const response = await fetch('http://localhost:8081/payments/create-order', {
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
    // Explicit error message to help pinpoint connection failures
    return NextResponse.json({ error: `Could not connect to the Neural Engine: ${error.message}` }, { status: 500 });
  }
}
