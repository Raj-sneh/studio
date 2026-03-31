
import { NextResponse } from 'next/server';

/**
 * @fileOverview Secure Proxy for coupon redemption.
 * Routes requests to the Python Neural Engine for administrative Firestore updates.
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || !body.code || !body.userId) {
       return NextResponse.json({ status: "invalid", message: "Missing code or user ID" }, { status: 400 });
    }

    // Use the live URL for production!
    const baseUrl = process.env.NEXT_PUBLIC_NEURAL_ENGINE_URL || process.env.NEURAL_ENGINE_URL || "http://localhost:8080";

    const response = await fetch(`${baseUrl}/api/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        status: response.status === 404 ? "invalid" : "error", 
        message: data.error || "Redemption failed." 
      }, { status: response.status });
    }

    return NextResponse.json({
      status: "success",
      credits: data.credits
    });

  } catch (error: any) {
    console.error("Redemption Proxy Error:", error);
    return NextResponse.json({ 
      status: "error", 
      message: "Neural Engine connection failed."
    }, { status: 500 });
  }
}
