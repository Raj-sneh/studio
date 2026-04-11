import { NextResponse } from 'next/server';

/**
 * Proxy route for deducting credits via the Primary Sargam Backend.
 */
export async function POST(req: Request) {
  try {
    const text = await req.text();
    if (!text) return NextResponse.json({ error: "Empty request body" }, { status: 400 });
    
    let body;
    try { body = JSON.parse(text); } catch (e) { return NextResponse.json({ error: "Invalid JSON input" }, { status: 400 }); }

    // Re-pointing to Sargam Backend for persistent database updates
    const baseUrl = "https://sargam-backend-398550479414.us-central1.run.app";

    const response = await fetch(`${baseUrl}/api/credits/use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    });
    
    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    if (!response.ok) {
        const errorData = isJson ? await response.json().catch(() => ({})) : { error: "Database engine error." };
        return NextResponse.json({ error: errorData.error || "Credit System Connection Failed" }, { status: 503 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: "Sargam Backend unreachable." }, { status: 503 });
  }
}
