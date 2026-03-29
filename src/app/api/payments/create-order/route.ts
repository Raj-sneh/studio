
import { NextResponse } from 'next/server';

/**
 * Proxy route for creating a Razorpay order via the Python backend.
 * Explicitly uses the uppercase NEURAL_ENGINE_URL for internal routing.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const baseUrl = process.env.NEURAL_ENGINE_URL || "http://localhost:8080";
    
    const response = await fetch(`${baseUrl}/api/payments/create-order`, {
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
    return NextResponse.json(
        { error: `Could not connect to the Neural Engine: ${error.message || 'fetch failed'}. Ensure the Python server is running.` }, 
        { status: 500 }
    );
  }
}
