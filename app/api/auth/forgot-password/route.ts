import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Simple in-memory rate limit: max 3 requests per email per 15 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }
  if (entry.count >= 3) return true;
  entry.count++;
  return false;
}

const schema = z.object({
  email: z.string().email().max(255),
  redirectTo: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = schema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { email, redirectTo } = result.data;

  if (isRateLimited(email.toLowerCase())) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Status prüfen – nur aktive User dürfen Reset-Email erhalten
  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("email", email)
    .single();

  if (!profile || profile.status !== "active") {
    return NextResponse.json({ error: "not_active" }, { status: 403 });
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
