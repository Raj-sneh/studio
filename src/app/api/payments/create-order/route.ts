import { NextResponse } from 'next/server';

/**
 * Proxy route for creating a Razorpay order via the Python backend.
 * Uses the specific production backend URL as the primary fallback.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const baseUrl = process.env.NEURAL_ENGINE_URL || 
                    process.env.NEXT_PUBLIC_NEURAL_ENGINE_URL || 
                    "https://neural-engine-398550479414.us-central1.run.app";
    
    const response = await fetch(`${baseUrl}/api/payments/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });
    
    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    if (!response.ok) {
        const errorData = isJson ? await response.json().catch(() => ({})) : { error: `Neural Engine status: ${response.status}` };
        return NextResponse.json(
            { error: errorData.error || `Payment service returned error ${response.status}` }, 
            { status: response.status }
        );
    }

    if (!isJson) {
      return NextResponse.json({ error: "Invalid response from payment service." }, { status: 502 });
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
