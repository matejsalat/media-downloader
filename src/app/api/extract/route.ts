import { NextRequest, NextResponse } from "next/server";

const EXTRACT_API_URL = process.env.EXTRACT_API_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid URL" },
        { status: 400 }
      );
    }

    const response = await fetch(`${EXTRACT_API_URL}/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Extraction failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Request timed out. The media may be unavailable." },
        { status: 504 }
      );
    }
    const isConnectionError =
      err instanceof TypeError && (err.message.includes("fetch") || err.message.includes("connect"));
    if (isConnectionError || !process.env.EXTRACT_API_URL) {
      return NextResponse.json(
        { error: "Backend API is not connected. Set the EXTRACT_API_URL environment variable." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
