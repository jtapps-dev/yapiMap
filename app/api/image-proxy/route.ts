import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing url", { status: 400 });

  // Only allow Supabase storage URLs
  const allowed = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace("https://", "");
  if (!url.includes(allowed)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) return new NextResponse("Failed", { status: 502 });
    const blob = await res.blob();
    return new NextResponse(blob, {
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse("Error", { status: 500 });
  }
}
