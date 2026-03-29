
import { NextResponse } from 'next/server';

/**
 * Proxy route for creating a Razorpay order via the Python backend.
 * Uses NEURAL_ENGINE_URL environment variable with fallback to localhost.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Support for both uppercase and lowercase env variables as requested
    const baseUrl = process.env.NEURAL_ENGINE_URL || process.env.neural_engine_url || "http://localhost:8080";
    
    const response = await fetch(`${baseUrl}/payments/create-order`, {
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
        { error: `Could not connect to the Neural Engine: ${error.message || 'fetch failed'}.` }, 
        { status: 500 }
    );
  }
}
