
import { NextResponse } from 'next/server';

/**
 * Proxy route for creating a Razorpay order via the Python backend.
 * Bypasses browser CORS and Mixed Content restrictions.
 * Targets the internal Python server on 127.0.0.1:8081.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Using 127.0.0.1 for the most reliable internal loopback communication
    const response = await fetch('http://127.0.0.1:8081/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
            { error: errorData.error || `Neural Engine error: ${response.status}` }, 
            { status: response.status }
        );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Proxy create-order error:", error);
    // Explicit error message to help pinpoint connection failures
    return NextResponse.json(
        { error: `Could not connect to the Neural Engine: ${error.message || 'Connection refused'}. Ensure the Python server is running on port 8081.` }, 
        { status: 500 }
    );
  }
}
