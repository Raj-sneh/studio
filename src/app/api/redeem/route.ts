import { NextResponse } from 'next/server';

/**
 * Secure Proxy for coupon redemption.
 * Safely handles non-JSON responses from the Neural Engine with production fallback.
 */
export async function POST(req: Request) {
  try {
    const text = await req.text();
    if (!text) {
       return NextResponse.json({ status: "invalid", message: "Missing request body" }, { status: 400 });
    }

    let body;
    try {
      body = JSON.parse(text);
    } catch (e) {
      return NextResponse.json({ status: "invalid", message: "Invalid JSON input" }, { status: 400 });
    }

    if (!body.code || !body.userId) {
       return NextResponse.json({ status: "invalid", message: "Missing code or user ID" }, { status: 400 });
    }

    // Priority: NEURAL_ENGINE_URL -> Production Link -> Localhost
    const baseUrl = process.env.NEURAL_ENGINE_URL || 
                    process.env.NEXT_PUBLIC_NEURAL_ENGINE_URL || 
                    "https://sargam-backend-398550479414.us-central1.run.app";

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
