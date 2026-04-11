import { NextResponse } from 'next/server';

/**
 * Proxy route for checking credit status via the Primary Sargam Backend.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  // Use Sargam Backend for Database/Credit operations
  const baseUrl = "https://sargam-backend-398550479414.us-central1.run.app";

  try {
    const response = await fetch(`${baseUrl}/api/credits/status/${userId}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000) 
    });
    
    const contentType = response.headers.get("content-type");
    if (!response.ok || !contentType || !contentType.includes("application/json")) {
        return NextResponse.json({ 
          status: "Offline",
          credits: 0,
          offline: true,
          message: "Database engine currently unreachable."
        }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.warn(`Sargam Backend connectivity: ${error.message || 'Connection refused'}`);
    return NextResponse.json({ error: "Credit System Offline", credits: 0, offline: true }, { status: 200 });
  }
}
