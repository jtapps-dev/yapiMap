import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 1000 });
    return false;
  }
  if (entry.count >= 20) return true;
  entry.count++;
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(ip)) return NextResponse.json({ valid: false }, { status: 429 });

  const { code } = await req.json();
  if (!code || typeof code !== "string" || code.length > 30) {
    return NextResponse.json({ valid: false });
  }

  // Aktuellen User holen um Selbst-Einladung zu verhindern
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("referral_code", code.toUpperCase().trim())
    .eq("status", "active")
    .single();

  if (!data) return NextResponse.json({ valid: false });

  // Eigener Code → ungültig
  if (user && data.id === user.id) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: true, name: data.full_name });
}
