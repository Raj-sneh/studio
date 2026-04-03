import { NextResponse } from 'next/server';

/**
 * Secure Proxy for coupon redemption.
 * Safely handles non-JSON responses from the Neural Engine.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || !body.code || !body.userId) {
       return NextResponse.json({ status: "invalid", message: "Missing code or user ID" }, { status: 400 });
    }

    const baseUrl = process.env.NEURAL_ENGINE_URL || process.env.NEXT_PUBLIC_NEURAL_ENGINE_URL || process.env.VOICE_ENGINE_URL || "http://localhost:8080";

    const response = await fetch(`${baseUrl}/api/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const contentType = response.headers.get("content-type");
    if (!response.ok || !contentType || !contentType.includes("application/json")) {
      return NextResponse.json({ 
        status: "error", 
        message: "Neural Engine redemption service unavailable." 
      }, { status: response.status === 200 ? 503 : response.status });
    }

    const data = await response.json();
    return NextResponse.json({
      status: "success",
      credits: data.credits
    });

  } catch (error: any) {
    console.error("Redemption Proxy Error:", error);
    return NextResponse.json({ 
      status: "error", 
      message: "Could not connect to the Neural Engine."
    }, { status: 500 });
  }
}
