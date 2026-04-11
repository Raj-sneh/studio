import { NextResponse } from 'next/server';

/**
 * Proxy route for stitching video scenes via the Neural Engine.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const baseUrl = process.env.NEURAL_ENGINE_URL || 
                    process.env.NEXT_PUBLIC_NEURAL_ENGINE_URL || 
                    "https://neural-engine-398550479414.us-central1.run.app";

    const response = await fetch(`${baseUrl}/stitch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json({ error: errorData.error || "Stitching failed." }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Proxy stitch error:", error);
    return NextResponse.json({ error: `Could not connect to stitching service: ${error.message}` }, { status: 500 });
  }
}
